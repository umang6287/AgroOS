import json

from fastapi.testclient import TestClient

from app.api.routes_auth import _session_cookie_policy
from main import app


ADMIN_PAYLOAD = {
    "userId": "farm-admin",
    "password": "initial-secret",
    "firstName": "Asha",
    "lastName": "Mehta",
    "whatsappNumber": "+15550001111",
    "mobileNumber": "+15550002222",
    "telegramAccount": "@asha_farm",
}


def test_first_run_setup_login_logout_and_sensitive_masking(monkeypatch, tmp_path):
    client = _auth_client(monkeypatch, tmp_path)

    status = client.get("/auth/status")
    assert status.status_code == 200
    assert status.json()["setupComplete"] is False

    setup = client.post("/auth/setup", json=ADMIN_PAYLOAD)
    assert setup.status_code == 200
    setup_data = setup.json()
    assert setup_data["user"]["userId"] == "farm-admin"
    assert setup_data["user"]["initials"] == "AM"
    assert setup_data["user"]["hasOpenAiKey"] is False
    _assert_sensitive_values_absent(setup_data, "initial-secret")

    duplicate = client.post("/auth/setup", json={**ADMIN_PAYLOAD, "firstName": "Other"})
    assert duplicate.status_code == 400

    second_admin = client.post(
        "/auth/setup",
        json={
            **ADMIN_PAYLOAD,
            "userId": "second-admin@example.com",
            "password": "second-secret",
            "firstName": "Ravi",
            "lastName": "Shah",
        },
    )
    assert second_admin.status_code == 200
    assert second_admin.json()["user"]["userId"] == "second-admin@example.com"
    assert second_admin.json()["user"]["initials"] == "RS"

    logged_in_status = client.get("/auth/status")
    assert logged_in_status.status_code == 200
    assert logged_in_status.json()["authenticated"] is True

    logout = client.post("/auth/logout")
    assert logout.status_code == 200
    assert client.get("/auth/status").json()["authenticated"] is False

    bad_login = client.post("/auth/login", json={"userId": "farm-admin", "password": "wrong-secret"})
    assert bad_login.status_code == 401

    good_login = client.post("/auth/login", json={"userId": "farm-admin", "password": "initial-secret"})
    assert good_login.status_code == 200
    _assert_sensitive_values_absent(good_login.json(), "initial-secret")

    second_login = client.post("/auth/login", json={"userId": "SECOND-ADMIN@example.com", "password": "second-secret"})
    assert second_login.status_code == 200
    assert second_login.json()["user"]["initials"] == "RS"


def test_profile_update_changes_contacts_password_and_openai_key(monkeypatch, tmp_path):
    client = _auth_client(monkeypatch, tmp_path)
    api_key = "sk-test-abcdefghijklmnopqrstuvwxyzabcdefghijklmnop"

    assert client.post("/auth/setup", json=ADMIN_PAYLOAD).status_code == 200

    response = client.patch(
        "/auth/profile",
        json={
            "firstName": "Mira",
            "lastName": "Patel",
            "whatsappNumber": "+15550003333",
            "mobileNumber": "",
            "telegramAccount": "@mira_farm",
            "password": "new-secret",
            "apiKey": api_key,
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["user"]["firstName"] == "Mira"
    assert data["user"]["lastName"] == "Patel"
    assert data["user"]["initials"] == "MP"
    assert data["user"]["whatsappNumber"] == "+15550003333"
    assert data["user"]["mobileNumber"] is None
    assert data["user"]["telegramAccount"] == "@mira_farm"
    assert data["user"]["hasOpenAiKey"] is True
    assert data["openAiKey"]["status"]["configured"] is True
    _assert_sensitive_values_absent(data, "new-secret", api_key)
    assert "passwordHash" not in json.dumps(data)
    assert "apiKey" not in json.dumps(data)

    assert client.post("/auth/logout").status_code == 200
    old_password_login = client.post("/auth/login", json={"userId": "farm-admin", "password": "initial-secret"})
    assert old_password_login.status_code == 401

    new_password_login = client.post("/auth/login", json={"userId": "farm-admin", "password": "new-secret"})
    assert new_password_login.status_code == 200
    assert new_password_login.json()["user"]["initials"] == "MP"
    _assert_sensitive_values_absent(new_password_login.json(), "new-secret", api_key)


def test_profile_update_only_changes_logged_in_admin(monkeypatch, tmp_path):
    client = _auth_client(monkeypatch, tmp_path)
    second_payload = {
        **ADMIN_PAYLOAD,
        "userId": "second-admin@example.com",
        "password": "second-secret",
        "firstName": "Ravi",
        "lastName": "Shah",
    }

    assert client.post("/auth/setup", json=ADMIN_PAYLOAD).status_code == 200
    assert client.post("/auth/setup", json=second_payload).status_code == 200
    assert client.post("/auth/logout").status_code == 200

    assert client.post("/auth/login", json={"userId": "second-admin@example.com", "password": "second-secret"}).status_code == 200
    update_response = client.patch("/auth/profile", json={"firstName": "Neha", "lastName": "Rao"})
    assert update_response.status_code == 200
    assert update_response.json()["user"]["initials"] == "NR"

    assert client.post("/auth/logout").status_code == 200
    first_login = client.post("/auth/login", json={"userId": "farm-admin", "password": "initial-secret"})
    assert first_login.status_code == 200
    assert first_login.json()["user"]["initials"] == "AM"


def test_auth_required_for_profile_and_sensitive_ai_key_write(monkeypatch, tmp_path):
    client = _auth_client(monkeypatch, tmp_path)
    api_key = "sk-test-abcdefghijklmnopqrstuvwxyzabcdefghijklmnop"

    profile_response = client.patch("/auth/profile", json={"firstName": "Nope"})
    assert profile_response.status_code == 401

    ai_key_response = client.post("/ai/config/openai-key", json={"apiKey": api_key, "validateKey": False})
    assert ai_key_response.status_code == 401


def test_session_cookie_policy_uses_secure_cross_site_for_https_frontend(monkeypatch):
    monkeypatch.setenv("FRONTEND_URL", "https://agrios-demo.vercel.app")

    assert _session_cookie_policy() == ("none", True)


def test_session_cookie_policy_keeps_localhost_development_cookie(monkeypatch):
    monkeypatch.setenv("FRONTEND_URL", "http://localhost:3000")

    assert _session_cookie_policy() == ("lax", False)


def _auth_client(monkeypatch, tmp_path) -> TestClient:
    from app.services import ai_config_service

    monkeypatch.setenv("AGRIOS_SIMULATION_DB_PATH", str(tmp_path / "auth.db"))
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.setattr(ai_config_service, "ENV_FILE", tmp_path / "backend.env")
    return TestClient(app)


def _assert_sensitive_values_absent(payload, *values: str) -> None:
    serialized = json.dumps(payload)
    for value in values:
        assert value not in serialized
    assert "password" not in serialized.lower()
    assert "password_hash" not in serialized
