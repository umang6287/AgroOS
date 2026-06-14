from types import SimpleNamespace

import pytest

from app.services import communication_gateway as gateway


@pytest.fixture(autouse=True)
def no_admin_profile(monkeypatch):
    monkeypatch.setattr(gateway, "_load_admin_profile", lambda: None)


def _base_request(severity="warning", selected_channel="whatsapp"):
    return {
        "communicationId": "comm-test-001",
        "runId": "run-test",
        "actionId": "act-test",
        "severity": severity,
        "preferredChannels": ["whatsapp", "telegram", "sms", "phone_call"],
        "selectedChannel": selected_channel,
        "recipientRole": "farmer",
        "message": "Zone B needs attention.",
        "language": "mr",
    }


def _set_twilio_env(monkeypatch):
    monkeypatch.setenv("TWILIO_ACCOUNT_SID", "AC_test")
    monkeypatch.setenv("TWILIO_AUTH_TOKEN", "token_test")
    monkeypatch.setenv("TWILIO_TRIAL_NUMBER", "+15551234567")
    monkeypatch.setenv("TWILIO_WHATSAPP_NUMBER", "+14155238886")
    monkeypatch.setenv("VERIFIED_MOBILE_NUMBER", "+919876543210")
    monkeypatch.setenv("AGRIOS_PUBLIC_BACKEND_URL", "https://example.ngrok.app")


def _clear_provider_env(monkeypatch):
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


class FakeTwilioClient:
    def __init__(self, *, fail_message=False, fail_call=False):
        self.message_calls = []
        self.call_calls = []
        self.fail_message = fail_message
        self.fail_call = fail_call
        self.messages = self
        self.calls = self

    def create(self, **kwargs):
        if "body" in kwargs:
            self.message_calls.append(kwargs)
            if self.fail_message:
                raise RuntimeError("twilio message down")
            return SimpleNamespace(sid="SM_test", status="queued")

        self.call_calls.append(kwargs)
        if self.fail_call:
            raise RuntimeError("twilio call down")
        return SimpleNamespace(sid="CA_test", status="queued")


def test_twilio_success_sends_expected_channel_without_telegram(monkeypatch):
    _set_twilio_env(monkeypatch)
    client = FakeTwilioClient()
    monkeypatch.setattr(gateway, "_twilio_client", lambda _config: client)
    monkeypatch.setattr(
        gateway,
        "_send_telegram_message",
        lambda _message: pytest.fail("Telegram should not be called when Twilio succeeds."),
    )

    communication = gateway.send_message(_base_request())

    assert communication["provider"] == "twilio"
    assert communication["selectedChannel"] == "whatsapp"
    assert communication["providerMessageId"] == "SM_test"
    assert communication["fallbackProvider"] is None
    assert client.message_calls[0]["from_"] == "whatsapp:+14155238886"


def test_twilio_prefers_admin_profile_whatsapp_number(monkeypatch):
    _set_twilio_env(monkeypatch)
    client = FakeTwilioClient()
    monkeypatch.setattr(gateway, "_twilio_client", lambda _config: client)
    monkeypatch.setattr(
        gateway,
        "_load_admin_profile",
        lambda: {
            "userId": "farm-admin",
            "whatsappNumber": "whatsapp:+918888888888",
            "mobileNumber": "+917777777777",
            "telegramAccount": "123456789",
        },
    )

    communication = gateway.send_message(_base_request())

    assert client.message_calls[0]["to"] == "whatsapp:+918888888888"
    assert communication["recipientSource"] == "profile"
    assert communication["recipientField"] == "whatsappNumber"


def test_twilio_prefers_admin_profile_mobile_for_sms(monkeypatch):
    _set_twilio_env(monkeypatch)
    client = FakeTwilioClient()
    monkeypatch.setattr(gateway, "_twilio_client", lambda _config: client)
    monkeypatch.setattr(
        gateway,
        "_load_admin_profile",
        lambda: {
            "userId": "farm-admin",
            "whatsappNumber": "+918888888888",
            "mobileNumber": "+917777777777",
            "telegramAccount": "123456789",
        },
    )

    communication = gateway.send_message(_base_request(selected_channel="sms"))

    assert client.message_calls[0]["to"] == "+917777777777"
    assert communication["recipientSource"] == "profile"
    assert communication["recipientField"] == "mobileNumber"


def test_telegram_prefers_admin_profile_account(monkeypatch):
    import requests

    monkeypatch.setenv("TELEGRAM_BOT_TOKEN", "bot-test")
    monkeypatch.setenv("TELEGRAM_CHAT_ID", "env-chat")
    monkeypatch.setattr(
        gateway,
        "_load_admin_profile",
        lambda: {
            "userId": "farm-admin",
            "whatsappNumber": "+918888888888",
            "mobileNumber": "+917777777777",
            "telegramAccount": "profile-chat",
        },
    )
    captured = {}

    class FakeTelegramResponse:
        status_code = 200
        text = '{"ok": true}'

        def json(self):
            return {"ok": True, "result": {"message_id": 42}}

    def fake_post(_url, *, json, timeout):
        captured.update(json)
        captured["timeout"] = timeout
        return FakeTelegramResponse()

    monkeypatch.setattr(requests, "post", fake_post)

    communication = gateway.send_message(_base_request(selected_channel="telegram"))

    assert captured["chat_id"] == "profile-chat"
    assert communication["provider"] == "telegram"
    assert communication["recipientSource"] == "profile"
    assert communication["recipientField"] == "telegramAccount"


def test_twilio_whatsapp_failure_sends_telegram_fallback(monkeypatch):
    _set_twilio_env(monkeypatch)
    monkeypatch.setattr(gateway, "_twilio_client", lambda _config: FakeTwilioClient(fail_message=True))
    monkeypatch.setattr(
        gateway,
        "_send_telegram_message",
        lambda _message, *_args: {"providerStatus": "sent", "providerMessageId": "tg-101"},
    )

    communication = gateway.send_message(_base_request())

    assert communication["provider"] == "telegram"
    assert communication["selectedChannel"] == "telegram"
    assert communication["fallbackProvider"] == "telegram"
    assert communication["fallbackReason"] == "twilio_whatsapp_error"
    assert communication["providerMessageId"] == "tg-101"
    assert communication["status"] == "sent"


def test_direct_telegram_sends_without_twilio(monkeypatch):
    monkeypatch.setattr(
        gateway,
        "_twilio_client",
        lambda _config: pytest.fail("Twilio should not be called for direct Telegram sends."),
    )
    monkeypatch.setattr(
        gateway,
        "_send_telegram_message",
        lambda _message, *_args: {"providerStatus": "sent", "providerMessageId": "tg-direct"},
    )

    communication = gateway.send_message(_base_request(selected_channel="telegram"))

    assert communication["provider"] == "telegram"
    assert communication["selectedChannel"] == "telegram"
    assert communication["fallbackProvider"] is None
    assert communication["providerMessageId"] == "tg-direct"
    assert communication["status"] == "sent"


def test_disabling_fallback_records_twilio_failure_without_telegram(monkeypatch):
    _clear_provider_env(monkeypatch)
    monkeypatch.setattr(
        gateway,
        "_send_telegram_message",
        lambda _message, *_args: pytest.fail("Telegram fallback should be disabled for this request."),
    )
    request = {**_base_request(), "allowFallback": False}

    communication = gateway.send_message(request)

    assert communication["status"] == "failed"
    assert communication["provider"] == "twilio"
    assert communication["selectedChannel"] == "whatsapp"
    assert communication["fallbackProvider"] is None
    assert communication["fallbackReason"] == "twilio_missing_config"
    assert [attempt["channel"] for attempt in communication["deliveryAttempts"]] == ["whatsapp"]


def test_critical_call_failure_sends_telegram_after_sms_attempt(monkeypatch):
    _set_twilio_env(monkeypatch)
    client = FakeTwilioClient(fail_call=True)
    monkeypatch.setattr(gateway, "_twilio_client", lambda _config: client)
    monkeypatch.setattr(
        gateway,
        "_send_telegram_message",
        lambda _message, *_args: {"providerStatus": "sent", "providerMessageId": "tg-critical"},
    )

    communication = gateway.send_message(_base_request(severity="critical", selected_channel="phone_call"))

    assert communication["provider"] == "telegram"
    assert communication["fallbackReason"] == "twilio_phone_call_error"
    assert [attempt["channel"] for attempt in communication["deliveryAttempts"]] == ["sms", "phone_call", "telegram"]
    assert client.message_calls
    assert client.call_calls


def test_phone_call_uses_inline_twiml_when_public_url_missing(monkeypatch):
    _set_twilio_env(monkeypatch)
    monkeypatch.setenv("AGRIOS_PUBLIC_BACKEND_URL", "")
    client = FakeTwilioClient()
    monkeypatch.setattr(gateway, "_twilio_client", lambda _config: client)

    communication = gateway.send_message(_base_request(selected_channel="phone_call"))

    assert communication["provider"] == "twilio"
    assert communication["selectedChannel"] == "phone_call"
    assert client.call_calls
    assert "twiml" in client.call_calls[0]
    assert "url" not in client.call_calls[0]


def test_missing_twilio_config_attempts_telegram_fallback(monkeypatch):
    _clear_provider_env(monkeypatch)
    monkeypatch.setattr(
        gateway,
        "_send_telegram_message",
        lambda _message, *_args: {"providerStatus": "sent", "providerMessageId": "tg-missing-twilio"},
    )

    communication = gateway.send_message(_base_request(severity="critical", selected_channel="phone_call"))

    assert communication["provider"] == "telegram"
    assert communication["fallbackProvider"] == "telegram"
    assert communication["fallbackReason"] == "twilio_missing_config"
    assert communication["status"] == "sent"


def test_missing_twilio_and_telegram_records_failed_review(monkeypatch):
    _clear_provider_env(monkeypatch)

    def fail_telegram(_message, *_args):
        raise gateway.ProviderDeliveryError("telegram", "telegram_missing_config", "Missing Telegram configuration.")

    monkeypatch.setattr(gateway, "_send_telegram_message", fail_telegram)

    communication = gateway.send_message(_base_request(severity="critical", selected_channel="phone_call"))

    assert communication["status"] == "failed"
    assert communication["fallbackProvider"] == "telegram"
    assert communication["requiresHumanReview"] is True
    assert "Telegram fallback failed" in communication["deliveryError"]


def test_twilio_status_failure_triggers_telegram_fallback(monkeypatch):
    _set_twilio_env(monkeypatch)
    monkeypatch.setattr(gateway, "_twilio_client", lambda _config: FakeTwilioClient())
    communication = gateway.send_message(_base_request())

    monkeypatch.setattr(
        gateway,
        "_send_telegram_message",
        lambda _message, *_args: {"providerStatus": "sent", "providerMessageId": "tg-status-fallback"},
    )

    updated = gateway.record_provider_status(communication["communicationId"], {"MessageStatus": "undelivered"})

    assert updated["provider"] == "telegram"
    assert updated["providerMessageId"] == "tg-status-fallback"
    assert updated["fallbackReason"] == "twilio_status_undelivered"
    assert updated["status"] == "sent"
