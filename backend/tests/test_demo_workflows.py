import pytest

from app.agents.communication_agent import run_communication_agent
from app.agents.outcome_agent import run_outcome_agent
from app.agents.supervisor_agent import run_sensor_anomaly_workflow, run_vision_workflow, run_voice_workflow
from app.demo_store import reset_demo_state
from app.simulator.sensor_generator import generate_sensor_reading


REQUIRED_ENVELOPE_FIELDS = {
    "agent",
    "status",
    "summary",
    "confidence",
    "latencyMs",
    "estimatedCostUsd",
    "requiresHumanReview",
    "data",
}


def assert_agent_envelope(step):
    assert REQUIRED_ENVELOPE_FIELDS.issubset(step.keys())
    assert isinstance(step["data"], dict)
    assert 0 <= step["confidence"] <= 1


def test_sensor_workflow_order_and_envelopes():
    reset_demo_state()

    trace = run_sensor_anomaly_workflow(generate_sensor_reading())

    assert [step["agent"] for step in trace["trace"]] == [
        "supervisor",
        "sensor",
        "weather",
        "risk",
        "planner",
        "robot",
        "communication",
        "outcome",
        "evaluation",
        "memory",
    ]
    for step in trace["trace"]:
        assert_agent_envelope(step)


def test_vision_workflow_order_and_approval():
    reset_demo_state()

    trace, result = run_vision_workflow({"imageId": "leaf-demo-tomato-001", "cropType": "mango", "zoneId": "zone-b"})

    assert result["agent"] == "vision"
    assert result["warnings"] == ["fallback:demo_vision_result"]
    assert [step["agent"] for step in trace["trace"]] == [
        "supervisor",
        "vision",
        "risk",
        "planner",
        "robot",
        "communication",
        "evaluation",
        "memory",
    ]
    planner = next(step for step in trace["trace"] if step["agent"] == "planner")
    assert planner["data"]["pendingApprovals"][0]["channel"] == "whatsapp"


def test_communication_records_provider_failure_without_credentials(monkeypatch):
    for key in [
        "TWILIO_ACCOUNT_SID",
        "TWILIO_AUTH_TOKEN",
        "TWILIO_TRIAL_NUMBER",
        "TWILIO_WHATSAPP_NUMBER",
        "VERIFIED_MOBILE_NUMBER",
        "TELEGRAM_BOT_TOKEN",
        "TELEGRAM_CHAT_ID",
        "BOT_TOKEN",
        "CHAT_ID",
        "AGRIOS_PUBLIC_BACKEND_URL",
    ]:
        monkeypatch.setenv(key, "")

    communication = run_communication_agent({"runId": "run-test", "risk": {"data": {"riskLevel": "high"}}})

    event = communication["data"]["communication"]
    assert event["status"] == "failed"
    assert event["fallbackProvider"] == "telegram"
    assert event["requiresHumanReview"] is True
    assert "communication:provider_delivery_failed" in communication["warnings"]


def test_outcome_compares_before_and_after_values():
    outcome = run_outcome_agent(
        {
            "telemetry": {"soilMoisturePct": 21},
            "planner": {"data": {"baselineMoisturePct": 21}},
        }
    )

    data = outcome["data"]["outcome"]
    assert data["beforeValue"] == 21
    assert data["afterValue"] > data["beforeValue"]
    assert data["status"] == "successful"


def test_voice_fallback_handles_simple_greeting():
    reset_demo_state()

    _, result = run_voice_workflow("Hi")

    assert result["status"] == "fallback"
    assert "AgriOS Saathi" in result["data"]["responseText"]
    assert "Zone B is dry" not in result["data"]["responseText"]


@pytest.mark.parametrize("workflow_runner", [run_sensor_anomaly_workflow])
def test_workflow_updates_evaluation_scorecards(workflow_runner):
    reset_demo_state()

    trace = workflow_runner()
    evaluation = next(step for step in trace["trace"] if step["agent"] == "evaluation")

    assert evaluation["data"]["scorecards"]
    assert evaluation["data"]["qualityScore"] == 0.96
