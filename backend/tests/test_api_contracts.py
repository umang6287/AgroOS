from fastapi.testclient import TestClient
from pathlib import Path

from main import app
from app.demo_store import reset_demo_state


client = TestClient(app)
AUTH_PAYLOAD = {
    "userId": "farm-admin",
    "password": "initial-secret",
    "firstName": "Asha",
    "lastName": "Mehta",
}


def test_farm_state_contract_includes_demo_extensions():
    reset_demo_state()

    response = client.get("/farm/state")

    assert response.status_code == 200
    data = response.json()
    assert data["zones"]
    assert data["activeActions"]
    assert "communicationEvents" in data
    assert "outcomeChecks" in data
    assert "journalEntries" in data
    assert "simulation" in data
    assert "assets" in data
    assert data["robots"][0]["currentWaypointId"]


def test_agent_trace_contract_returns_complete_workflow():
    reset_demo_state()

    response = client.get("/agents/trace")

    assert response.status_code == 200
    data = response.json()
    assert data["workflow"] == "sensor_anomaly"
    assert len(data["trace"]) == 10
    assert data["trace"][0]["agent"] == "supervisor"


def test_vision_route_updates_latest_trace():
    reset_demo_state()

    response = client.post("/vision/analyze", json={"imageId": "leaf-demo-tomato-001", "cropType": "mango", "zoneId": "zone-b"})

    assert response.status_code == 200
    result = response.json()
    assert result["agent"] == "vision"
    assert result["status"] == "fallback"
    assert result["data"]["workflowRunId"] == "run-vision-zone-b-001"

    trace_response = client.get("/agents/trace")
    assert trace_response.json()["workflow"] == "vision"


def test_voice_route_returns_text_fallback():
    reset_demo_state()
    _login_test_admin()

    response = client.post("/voice/ask", json={"prompt": "Call my farm", "language": "mr", "includeAudio": False})

    assert response.status_code == 200
    result = response.json()
    assert result["agent"] == "voice"
    assert result["status"] == "fallback"
    assert result["data"]["language"] == "mr"
    assert result["data"]["responseText"]


def test_evaluation_route_returns_scorecards():
    reset_demo_state()

    response = client.get("/evaluation/scorecards")

    assert response.status_code == 200
    assert response.json()["scorecards"]


def test_twilio_voice_answer_returns_twiml():
    response = client.post("/communication/twilio/voice/answer/comm-test")

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("application/xml")
    assert "<Gather" in response.text
    assert "AgriOS Saathi" in response.text


def test_twilio_status_callback_records_provider_status():
    response = client.post(
        "/communication/twilio/status/comm-test",
        content="MessageStatus=failed&MessageSid=SM_test",
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )

    assert response.status_code == 200
    assert response.json()["providerStatus"] == "failed"


def test_communications_test_route_simulates_all_channels():
    reset_demo_state()
    _login_test_admin()

    response = client.post("/communications/test", json={})

    assert response.status_code == 200
    data = response.json()
    assert data["realDelivery"] is False
    assert data["channels"] == ["whatsapp", "telegram", "sms", "phone_call"]
    assert [event["selectedChannel"] for event in data["communications"]] == data["channels"]
    assert {event["status"] for event in data["communications"]} == {"simulated"}

    communication_ids = {event["communicationId"] for event in data["communications"]}
    list_response = client.get("/communications")

    assert list_response.status_code == 200
    listed_ids = {event["communicationId"] for event in list_response.json()["communications"]}
    assert communication_ids.issubset(listed_ids)


def test_communications_test_route_requires_real_delivery_confirmation():
    _login_test_admin()

    response = client.post("/communications/test", json={"realDelivery": True})

    assert response.status_code == 400
    assert "SEND_REAL_COMMUNICATIONS" in response.json()["detail"]


def test_simulation_routes_return_recent_ticks():
    reset_demo_state()

    status_response = client.get("/simulation/status")
    events_response = client.get("/simulation/events?limit=3")

    assert status_response.status_code == 200
    assert status_response.json()["latestEventId"].startswith("evt-sim-")
    assert events_response.status_code == 200
    assert events_response.json()["events"]
    assert events_response.json()["events"][-1]["type"] == "simulation.tick"


def test_ai_config_status_never_returns_api_key(monkeypatch):
    monkeypatch.setenv("OPENAI_API_KEY", "sk-test-abcdefghijklmnopqrstuvwxyzabcdefghijklmnop")

    response = client.get("/ai/config/status")

    assert response.status_code == 200
    data = response.json()
    assert data["configured"] is True
    assert "apiKey" not in data
    assert "key" not in data


def test_ai_config_saves_byok_to_backend_env(monkeypatch, tmp_path):
    from app.services import ai_config_service

    env_file = tmp_path / "agrios-test-openai.env"
    env_file.unlink(missing_ok=True)
    monkeypatch.setattr(ai_config_service, "ENV_FILE", env_file)
    monkeypatch.setenv("AGRIOS_SIMULATION_DB_PATH", str(tmp_path / "auth.db"))
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    api_key = "sk-test-abcdefghijklmnopqrstuvwxyzabcdefghijklmnop"

    setup = client.post(
        "/auth/setup",
        json={
            "userId": "farm-admin",
            "password": "initial-secret",
            "firstName": "Asha",
            "lastName": "Mehta",
        },
    )
    assert setup.status_code == 200

    response = client.post("/ai/config/openai-key", json={"apiKey": api_key, "validateKey": False})

    assert response.status_code == 200
    data = response.json()
    assert data["configured"] is True
    assert "apiKey" not in data
    assert env_file.read_text(encoding="utf-8").strip() == f"OPENAI_API_KEY={api_key}"
    env_file.unlink(missing_ok=True)


def test_sensitive_workflow_endpoints_require_authentication():
    logout_response = client.post("/auth/logout")
    assert logout_response.status_code == 200

    voice_response = client.post("/voice/ask", json={"prompt": "Call my farm"})
    communication_response = client.post("/communications/test", json={})
    communication_list_response = client.get("/communications")
    ai_validate_response = client.post(
        "/ai/config/validate",
        json={"apiKey": "sk-test-abcdefghijklmnopqrstuvwxyzabcdefghijklmnop"},
    )

    assert voice_response.status_code == 401
    assert communication_response.status_code == 401
    assert communication_list_response.status_code == 401
    assert ai_validate_response.status_code == 401


def _login_test_admin():
    setup = client.post("/auth/setup", json=AUTH_PAYLOAD)
    if setup.status_code not in {200, 400}:
        raise AssertionError(setup.text)

    login = client.post("/auth/login", json={"userId": AUTH_PAYLOAD["userId"], "password": AUTH_PAYLOAD["password"]})
    if login.status_code != 200:
        raise AssertionError(login.text)
