from app.agents.communication_agent import run_communication_agent
from app.agents.envelope import make_envelope
from app.agents.evaluation_agent import run_evaluation_agent
from app.agents.memory_agent import run_memory_agent
from app.agents.outcome_agent import run_outcome_agent
from app.agents.planner_agent import run_planner_agent
from app.agents.risk_agent import run_risk_agent
from app.agents.robot_agent import run_robot_agent
from app.agents.sensor_agent import run_sensor_agent
from app.agents.vision_agent import run_vision_agent
from app.agents.voice_agent import run_voice_agent
from app.agents.weather_agent import run_weather_agent
from app.demo_store import get_farm_state, record_workflow, server_now_iso
from app.simulator.sensor_generator import generate_sensor_reading


def run_supervisor(event):
    return make_envelope(
        agent="supervisor",
        summary="Supervisor routed the event into the correct AgriOS workflow.",
        confidence=0.96,
        latency_ms=95,
        data={"event": event},
        explanation=["Workflow routing is deterministic for the hackathon demo."],
        next_agent=event.get("nextAgent"),
    )


def run_sensor_anomaly_workflow(telemetry=None, language: str = "en"):
    telemetry = telemetry or generate_sensor_reading()
    run_id = "run-sensor-zone-b-001"
    supervisor = run_supervisor(
        {
            "type": "telemetry.updated",
            "zoneId": telemetry.get("zoneId", "zone-b"),
            "workflow": "sensor_anomaly",
            "nextAgent": "sensor",
        }
    )
    sensor = run_sensor_agent(telemetry)
    weather = run_weather_agent({"zoneId": telemetry.get("zoneId", "zone-b")})
    risk = run_risk_agent({"sensor": sensor, "weather": weather, "memory": get_farm_state().get("journalEntries", []), "language": language})
    planner = run_planner_agent(
        {
            "sensor": sensor,
            "weather": weather,
            "risk": risk,
            "autonomyMode": get_farm_state().get("autonomyMode", "auto_schedule_low_risk"),
            "language": language,
        }
    )
    robot = run_robot_agent({"planner": planner, "language": language})
    communication = run_communication_agent({"runId": run_id, "risk": risk, "planner": planner, "robot": robot, "language": language})
    outcome = run_outcome_agent({"telemetry": telemetry, "planner": planner})

    steps_before_evaluation = [supervisor, sensor, weather, risk, planner, robot, communication, outcome]
    evaluation = run_evaluation_agent({"workflow": "sensor_anomaly", "steps": steps_before_evaluation})
    memory = run_memory_agent(
        {
            "workflow": "sensor_anomaly",
            "zoneId": telemetry.get("zoneId", "zone-b"),
            "summary": "Recorded low moisture, scheduled irrigation, simulated farmer alert, and verified outcome.",
            "actionId": "act-irrigate-zone-b-001",
        }
    )

    return _record_trace(run_id, "sensor_anomaly", [*steps_before_evaluation, evaluation, memory])


def run_vision_workflow(image_context):
    run_id = "run-vision-zone-b-001"
    language = image_context.get("language", "en")
    telemetry = generate_sensor_reading()
    supervisor = run_supervisor(
        {
            "type": "leaf.uploaded",
            "zoneId": image_context.get("zoneId", "zone-b"),
            "workflow": "vision",
            "nextAgent": "vision",
        }
    )
    vision = run_vision_agent(image_context)
    weather = run_weather_agent({"zoneId": image_context.get("zoneId", "zone-b")})
    risk = run_risk_agent(
        {
            "sensor": run_sensor_agent(telemetry),
            "weather": weather,
            "vision": vision,
            "memory": get_farm_state().get("journalEntries", []),
            "language": language,
        }
    )
    planner = run_planner_agent(
        {
            "sensor": {"data": {"soilMoisturePct": telemetry["soilMoisturePct"], "zoneId": telemetry["zoneId"]}},
            "weather": weather,
            "vision": vision,
            "risk": risk,
            "autonomyMode": get_farm_state().get("autonomyMode", "auto_schedule_low_risk"),
            "language": language,
        }
    )
    robot = run_robot_agent({"planner": planner, "language": language})
    communication = run_communication_agent({"runId": run_id, "risk": risk, "planner": planner, "robot": robot, "language": language})

    steps_before_evaluation = [supervisor, vision, risk, planner, robot, communication]
    evaluation = run_evaluation_agent({"workflow": "vision", "steps": steps_before_evaluation})
    memory = run_memory_agent(
        {
            "workflow": "vision",
            "zoneId": image_context.get("zoneId", "zone-b"),
            "summary": "Recorded fallback leaf analysis, robot inspection, and treatment approval request.",
            "actionId": "act-treatment-review-zone-b-001",
        }
    )

    trace = _record_trace(run_id, "vision", [*steps_before_evaluation, evaluation, memory])
    return trace, {**vision, "data": {**vision["data"], "workflowRunId": run_id}}


def run_voice_workflow(
    prompt: str,
    language: str = "en",
    include_audio: bool = False,
    transcription: dict | None = None,
    conversation_id: str | None = None,
    history: list[dict] | None = None,
):
    run_id = "run-voice-farm-001"
    voice_received = run_voice_agent({"prompt": prompt, "language": language, "phase": "received"})
    memory = run_memory_agent(
        {
            "workflow": "voice",
            "zoneId": "farm",
            "summary": "Voice Agent retrieved recent risks, scheduled actions, pending approvals, and outcomes.",
            "actionId": None,
        }
    )
    supervisor = run_supervisor(
        {
            "type": "voice.prompt.received",
            "workflow": "voice",
            "language": language,
            "includeAudio": include_audio,
            "nextAgent": "voice",
        }
    )
    voice_response = run_voice_agent(
        {
            "prompt": prompt,
            "language": language,
            "phase": "response",
            "farmState": get_farm_state(),
            "includeAudio": include_audio,
            "transcription": transcription,
            "conversationId": conversation_id,
            "history": history or [],
        }
    )

    trace = _record_trace(run_id, "voice", [voice_received, memory, supervisor, voice_response])
    return trace, {**voice_response, "data": {**voice_response["data"], "workflowRunId": run_id}}


def _record_trace(run_id, workflow, steps):
    now = server_now_iso()
    trace = {
        "runId": run_id,
        "workflow": workflow,
        "status": "completed",
        "startedAt": now,
        "completedAt": now,
        "trace": steps,
    }
    return record_workflow(trace)
