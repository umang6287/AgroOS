from __future__ import annotations

from html import escape
import os
from dataclasses import dataclass
from typing import Any
from urllib.parse import quote

from app.demo_store import server_now_iso
from app.services.ai_config_service import load_backend_env


AGRIOS_SAATHI_NAME = "AgriOS Saathi"
TWILIO_FAILED_STATUSES = {"failed", "undelivered", "no-answer", "busy", "canceled"}
TWILIO_SUCCESS_STATUSES = {"accepted", "queued", "ringing", "sent", "delivered", "in-progress", "completed"}
CALLBACK_TIMEOUT_SECONDS = 8
TWILIO_LOCALES = {
    "en": "en-US",
    "mr": "mr-IN",
    "hi": "hi-IN",
    "gu": "gu-IN",
}

_COMMUNICATION_CACHE: dict[str, dict[str, Any]] = {}


@dataclass
class ProviderDeliveryError(Exception):
    provider: str
    reason: str
    message: str
    provider_status: str | None = None

    def __str__(self) -> str:
        return self.message


def send_message(request: dict[str, Any]) -> dict[str, Any]:
    load_backend_env()

    base = {
        **request,
        "communicationId": request.get("communicationId") or f"comm-{server_now_iso()}",
        "displayAgentName": AGRIOS_SAATHI_NAME,
        "createdAt": request.get("createdAt") or server_now_iso(),
        "status": "queued",
        "provider": None,
        "providerStatus": None,
        "providerMessageId": None,
        "providerCallSid": None,
        "fallbackProvider": None,
        "fallbackReason": None,
        "deliveryError": None,
        "requiresHumanReview": False,
        "deliveryAttempts": [],
        "allowFallback": request.get("allowFallback", True),
    }

    route = _provider_route(base)
    if route == ["in_app"]:
        communication = {
            **base,
            "status": "sent",
            "provider": "in_app",
            "providerStatus": "sent",
            "selectedChannel": "in_app",
        }
        _cache_communication(communication)
        return communication

    if route == ["telegram"]:
        communication = _send_direct_telegram(base)
        _cache_communication(communication)
        return communication

    twilio_attempts: list[dict[str, Any]] = []
    twilio_results: list[dict[str, Any]] = []
    twilio_error: ProviderDeliveryError | None = None

    for channel in route:
        try:
            result = _send_twilio_channel(channel, base)
            twilio_results.append(result)
            twilio_attempts.append(_attempt(channel, "twilio", "sent", provider_status=result.get("providerStatus")))
        except ProviderDeliveryError as exc:
            twilio_error = exc
            twilio_attempts.append(_attempt(channel, "twilio", "failed", exc.reason, exc.message, exc.provider_status))
            break

    if len(twilio_results) == len(route):
        communication = _communication_from_twilio_success(base, route, twilio_results, twilio_attempts)
        _cache_communication(communication)
        return communication

    fallback_reason = twilio_error.reason if twilio_error else "twilio_partial_failure"
    fallback_error = str(twilio_error) if twilio_error else "Twilio did not complete every required delivery channel."

    if not base.get("allowFallback", True):
        communication = {
            **base,
            "selectedChannel": route[-1],
            "status": "failed",
            "provider": "twilio",
            "providerStatus": twilio_error.provider_status if twilio_error else "failed",
            "providerMessageId": _first_value(twilio_results, "providerMessageId"),
            "providerCallSid": _first_value(twilio_results, "providerCallSid"),
            "fallbackReason": fallback_reason,
            "deliveryError": fallback_error,
            "deliveryAttempts": twilio_attempts,
            "requiresHumanReview": True,
        }
        _cache_communication(communication)
        return communication

    try:
        telegram_result = _send_telegram_message(base["message"], base)
        communication = {
            **base,
            "selectedChannel": "telegram",
            "status": "sent",
            "provider": "telegram",
            "providerStatus": telegram_result.get("providerStatus", "sent"),
            "providerMessageId": telegram_result.get("providerMessageId"),
            "providerCallSid": _first_value(twilio_results, "providerCallSid"),
            "recipientSource": telegram_result.get("recipientSource"),
            "recipientField": telegram_result.get("recipientField"),
            "fallbackProvider": "telegram",
            "fallbackReason": fallback_reason,
            "deliveryError": fallback_error,
            "deliveryAttempts": [
                *twilio_attempts,
                _attempt("telegram", "telegram", "sent", provider_status=telegram_result.get("providerStatus", "sent")),
            ],
            "requiresHumanReview": False,
        }
    except ProviderDeliveryError as telegram_exc:
        communication = {
            **base,
            "status": "failed",
            "provider": "twilio",
            "providerStatus": twilio_error.provider_status if twilio_error else "failed",
            "providerMessageId": _first_value(twilio_results, "providerMessageId"),
            "providerCallSid": _first_value(twilio_results, "providerCallSid"),
            "fallbackProvider": "telegram",
            "fallbackReason": fallback_reason,
            "deliveryError": f"{fallback_error} Telegram fallback failed: {telegram_exc.message}",
            "deliveryAttempts": [
                *twilio_attempts,
                _attempt(
                    "telegram",
                    "telegram",
                    "failed",
                    telegram_exc.reason,
                    telegram_exc.message,
                    telegram_exc.provider_status,
                ),
            ],
            "requiresHumanReview": True,
        }

    _cache_communication(communication)
    return communication


def get_cached_communication(communication_id: str) -> dict[str, Any] | None:
    return _COMMUNICATION_CACHE.get(communication_id)


def record_provider_status(communication_id: str, status_payload: dict[str, Any]) -> dict[str, Any]:
    communication = _COMMUNICATION_CACHE.get(communication_id, {"communicationId": communication_id})
    provider_status = (
        status_payload.get("MessageStatus")
        or status_payload.get("CallStatus")
        or status_payload.get("SmsStatus")
        or status_payload.get("status")
    )
    if provider_status:
        communication["providerStatus"] = provider_status
        if str(provider_status).lower() in TWILIO_FAILED_STATUSES:
            _fallback_after_twilio_status_failure(communication, str(provider_status).lower())
    communication["lastProviderCallback"] = {key: str(value) for key, value in status_payload.items()}
    communication["updatedAt"] = server_now_iso()
    _cache_communication(communication)
    return communication


def _provider_route(request: dict[str, Any]) -> list[str]:
    severity = str(request.get("severity", "")).lower()
    selected_channel = request.get("selectedChannel")
    if severity == "critical":
        return ["sms", "phone_call"]
    if severity == "approval_needed":
        return ["whatsapp"]
    if selected_channel == "telegram":
        return ["telegram"]
    if selected_channel in {"whatsapp", "sms", "phone_call"}:
        return [selected_channel]
    if severity in {"high", "warning"}:
        return ["whatsapp"]
    return ["in_app"]


def _send_twilio_channel(channel: str, request: dict[str, Any]) -> dict[str, Any]:
    if channel == "whatsapp":
        return _send_twilio_message(request, channel="whatsapp")
    if channel == "sms":
        return _send_twilio_message(request, channel="sms")
    if channel == "phone_call":
        return _send_twilio_call(request)
    raise ProviderDeliveryError("twilio", "unsupported_channel", f"Unsupported Twilio channel: {channel}")


def _send_twilio_message(request: dict[str, Any], *, channel: str) -> dict[str, Any]:
    config = _twilio_config(channel, request)
    client = _twilio_client(config)
    to_number = config["to_number"]
    from_number = config["whatsapp_from"] if channel == "whatsapp" else config["twilio_number"]
    if channel == "whatsapp":
        to_number = f"whatsapp:{to_number}"
        from_number = f"whatsapp:{from_number}"

    try:
        create_kwargs = {
            "body": request["message"],
            "to": to_number,
            "from_": from_number,
        }
        status_callback = _status_callback_url(request["communicationId"])
        if status_callback:
            create_kwargs["status_callback"] = status_callback
        message = client.messages.create(**create_kwargs)
    except Exception as exc:  # pragma: no cover - provider/network dependent
        raise ProviderDeliveryError("twilio", f"twilio_{channel}_error", _safe_provider_error(exc)) from exc

    provider_status = str(getattr(message, "status", "sent") or "sent")
    if provider_status.lower() in TWILIO_FAILED_STATUSES:
        raise ProviderDeliveryError(
            "twilio",
            f"twilio_{channel}_failed",
            f"Twilio {channel} returned status {provider_status}.",
            provider_status,
        )

    return {
        "channel": channel,
        "provider": "twilio",
        "providerStatus": provider_status if provider_status.lower() in TWILIO_SUCCESS_STATUSES else "sent",
        "providerMessageId": getattr(message, "sid", None),
        "recipientSource": config["recipient_source"],
        "recipientField": config["recipient_field"],
    }


def _send_twilio_call(request: dict[str, Any]) -> dict[str, Any]:
    config = _twilio_config("phone_call", request)
    client = _twilio_client(config)
    create_kwargs = {
        "to": config["to_number"],
        "from_": config["twilio_number"],
        "timeout": CALLBACK_TIMEOUT_SECONDS,
    }
    if config["public_backend_url"]:
        create_kwargs.update(
            {
                "url": _voice_answer_url(request["communicationId"]),
                "method": "POST",
                "status_callback": _status_callback_url(request["communicationId"]),
                "status_callback_method": "POST",
            }
        )
    else:
        create_kwargs["twiml"] = _inline_call_twiml(request["message"], request.get("language", "en"))

    try:
        call = client.calls.create(**create_kwargs)
    except Exception as exc:  # pragma: no cover - provider/network dependent
        raise ProviderDeliveryError("twilio", "twilio_phone_call_error", _safe_provider_error(exc)) from exc

    provider_status = str(getattr(call, "status", "queued") or "queued")
    if provider_status.lower() in TWILIO_FAILED_STATUSES:
        raise ProviderDeliveryError(
            "twilio",
            "twilio_phone_call_failed",
            f"Twilio call returned status {provider_status}.",
            provider_status,
        )

    return {
        "channel": "phone_call",
        "provider": "twilio",
        "providerStatus": provider_status if provider_status.lower() in TWILIO_SUCCESS_STATUSES else "queued",
        "providerCallSid": getattr(call, "sid", None),
        "recipientSource": config["recipient_source"],
        "recipientField": config["recipient_field"],
    }


def _send_telegram_message(message: str, request: dict[str, Any] | None = None) -> dict[str, Any]:
    config = _telegram_config(request or {})
    try:
        import requests

        response = requests.post(
            f"https://api.telegram.org/bot{config['bot_token']}/sendMessage",
            json={"chat_id": config["chat_id"], "text": message},
            timeout=8,
        )
    except Exception as exc:  # pragma: no cover - provider/network dependent
        raise ProviderDeliveryError("telegram", "telegram_send_error", _safe_provider_error(exc)) from exc

    if response.status_code >= 400:
        raise ProviderDeliveryError("telegram", "telegram_http_error", response.text[:240], str(response.status_code))

    try:
        payload = response.json()
    except ValueError as exc:
        raise ProviderDeliveryError("telegram", "telegram_invalid_response", "Telegram returned non-JSON response.") from exc

    if not payload.get("ok", False):
        description = str(payload.get("description") or "Telegram sendMessage failed.")
        raise ProviderDeliveryError("telegram", "telegram_api_error", description, str(payload.get("error_code", "")))

    result = payload.get("result", {})
    return {
        "provider": "telegram",
        "providerStatus": "sent",
        "providerMessageId": str(result.get("message_id", "")) or None,
        "recipientSource": config["recipient_source"],
        "recipientField": config["recipient_field"],
    }


def _send_direct_telegram(base: dict[str, Any]) -> dict[str, Any]:
    try:
        telegram_result = _send_telegram_message(base["message"], base)
        return {
            **base,
            "selectedChannel": "telegram",
            "status": "sent",
            "provider": "telegram",
            "providerStatus": telegram_result.get("providerStatus", "sent"),
            "providerMessageId": telegram_result.get("providerMessageId"),
            "recipientSource": telegram_result.get("recipientSource"),
            "recipientField": telegram_result.get("recipientField"),
            "deliveryAttempts": [
                _attempt("telegram", "telegram", "sent", provider_status=telegram_result.get("providerStatus", "sent"))
            ],
            "requiresHumanReview": False,
        }
    except ProviderDeliveryError as exc:
        return {
            **base,
            "selectedChannel": "telegram",
            "status": "failed",
            "provider": "telegram",
            "providerStatus": exc.provider_status,
            "deliveryError": exc.message,
            "deliveryAttempts": [
                _attempt("telegram", "telegram", "failed", exc.reason, exc.message, exc.provider_status)
            ],
            "requiresHumanReview": True,
        }


def _communication_from_twilio_success(
    base: dict[str, Any],
    route: list[str],
    results: list[dict[str, Any]],
    attempts: list[dict[str, Any]],
) -> dict[str, Any]:
    return {
        **base,
        "selectedChannel": route[-1],
        "status": "sent",
        "provider": "twilio",
        "providerStatus": "sent",
        "providerMessageId": _first_value(results, "providerMessageId"),
        "providerCallSid": _first_value(results, "providerCallSid"),
        "recipientSource": _first_value(results, "recipientSource"),
        "recipientField": _first_value(results, "recipientField"),
        "deliveryAttempts": attempts,
        "requiresHumanReview": False,
    }


def _fallback_after_twilio_status_failure(communication: dict[str, Any], provider_status: str) -> None:
    if communication.get("fallbackProvider") == "telegram" or not communication.get("message"):
        communication["status"] = "failed"
        communication["requiresHumanReview"] = True
        return

    fallback_reason = f"twilio_status_{provider_status}"
    delivery_attempts = communication.setdefault("deliveryAttempts", [])
    try:
        telegram_result = _send_telegram_message(communication["message"], communication)
        communication.update(
            {
                "selectedChannel": "telegram",
                "status": "sent",
                "provider": "telegram",
                "providerStatus": telegram_result.get("providerStatus", "sent"),
                "providerMessageId": telegram_result.get("providerMessageId"),
                "recipientSource": telegram_result.get("recipientSource"),
                "recipientField": telegram_result.get("recipientField"),
                "fallbackProvider": "telegram",
                "fallbackReason": fallback_reason,
                "deliveryError": f"Twilio provider callback returned {provider_status}.",
                "requiresHumanReview": False,
            }
        )
        delivery_attempts.append(
            _attempt("telegram", "telegram", "sent", fallback_reason, provider_status=telegram_result.get("providerStatus", "sent"))
        )
    except ProviderDeliveryError as exc:
        communication.update(
            {
                "status": "failed",
                "fallbackProvider": "telegram",
                "fallbackReason": fallback_reason,
                "deliveryError": f"Twilio provider callback returned {provider_status}. Telegram fallback failed: {exc.message}",
                "requiresHumanReview": True,
            }
        )
        delivery_attempts.append(_attempt("telegram", "telegram", "failed", exc.reason, exc.message, exc.provider_status))


def _twilio_config(channel: str, request: dict[str, Any]) -> dict[str, str]:
    account_sid = os.getenv("TWILIO_ACCOUNT_SID", "").strip()
    auth_token = os.getenv("TWILIO_AUTH_TOKEN", "").strip()
    twilio_number = os.getenv("TWILIO_TRIAL_NUMBER", "").strip()
    whatsapp_from = os.getenv("TWILIO_WHATSAPP_NUMBER", "").strip()
    recipient = _resolve_recipient(channel, request)
    to_number = recipient["value"]
    public_backend_url = os.getenv("AGRIOS_PUBLIC_BACKEND_URL", "").strip().rstrip("/")

    missing = [
        key
        for key, value in {
            "TWILIO_ACCOUNT_SID": account_sid,
            "TWILIO_AUTH_TOKEN": auth_token,
        }.items()
        if not value
    ]
    if not to_number:
        missing.append(_recipient_missing_label(channel))
    if channel in {"sms", "phone_call"} and not twilio_number:
        missing.append("TWILIO_TRIAL_NUMBER")
    if channel == "whatsapp" and not whatsapp_from:
        missing.append("TWILIO_WHATSAPP_NUMBER")

    if missing:
        raise ProviderDeliveryError(
            "twilio",
            "twilio_missing_config",
            f"Missing Twilio configuration: {', '.join(missing)}.",
        )

    return {
        "account_sid": account_sid,
        "auth_token": auth_token,
        "twilio_number": twilio_number,
        "whatsapp_from": whatsapp_from,
        "to_number": to_number,
        "public_backend_url": public_backend_url,
        "recipient_source": recipient["source"],
        "recipient_field": recipient["field"],
    }


def _telegram_config(request: dict[str, Any]) -> dict[str, str]:
    bot_token = os.getenv("TELEGRAM_BOT_TOKEN", "").strip() or os.getenv("BOT_TOKEN", "").strip()
    recipient = _resolve_recipient("telegram", request)
    chat_id = recipient["value"]
    missing = []
    if not bot_token:
        missing.append("TELEGRAM_BOT_TOKEN")
    if not chat_id:
        missing.append("farm_admin_profile.telegram_account or TELEGRAM_CHAT_ID")
    if missing:
        raise ProviderDeliveryError(
            "telegram",
            "telegram_missing_config",
            f"Missing Telegram configuration: {', '.join(missing)}.",
        )
    return {
        "bot_token": bot_token,
        "chat_id": chat_id,
        "recipient_source": recipient["source"],
        "recipient_field": recipient["field"],
    }


def _resolve_recipient(channel: str, request: dict[str, Any]) -> dict[str, str | None]:
    profile = _load_admin_profile()
    candidates = _recipient_candidates(channel, request, profile)
    for source, field, value in candidates:
        normalized = _normalize_recipient_value(channel, value)
        if normalized:
            return {"value": normalized, "source": source, "field": field}
    return {"value": "", "source": None, "field": None}


def _recipient_candidates(
    channel: str,
    request: dict[str, Any],
    profile: dict[str, Any] | None,
) -> list[tuple[str, str, Any]]:
    if channel == "telegram":
        return [
            ("request", "telegramChatId", request.get("telegramChatId")),
            ("request", "telegramAccount", request.get("telegramAccount")),
            ("profile", "telegramAccount", (profile or {}).get("telegramAccount")),
            ("env", "TELEGRAM_CHAT_ID", os.getenv("TELEGRAM_CHAT_ID")),
            ("env", "CHAT_ID", os.getenv("CHAT_ID")),
        ]

    if channel == "whatsapp":
        return [
            ("request", "whatsappNumber", request.get("whatsappNumber")),
            ("request", "toNumber", request.get("toNumber")),
            ("profile", "whatsappNumber", (profile or {}).get("whatsappNumber")),
            ("profile", "mobileNumber", (profile or {}).get("mobileNumber")),
            ("env", "VERIFIED_MOBILE_NUMBER", os.getenv("VERIFIED_MOBILE_NUMBER")),
        ]

    return [
        ("request", "mobileNumber", request.get("mobileNumber")),
        ("request", "toNumber", request.get("toNumber")),
        ("profile", "mobileNumber", (profile or {}).get("mobileNumber")),
        ("profile", "whatsappNumber", (profile or {}).get("whatsappNumber")),
        ("env", "VERIFIED_MOBILE_NUMBER", os.getenv("VERIFIED_MOBILE_NUMBER")),
    ]


def _load_admin_profile() -> dict[str, Any] | None:
    try:
        from app.services.auth_service import get_admin_profile

        return get_admin_profile()
    except Exception:
        return None


def _normalize_recipient_value(channel: str, value: Any) -> str:
    normalized = str(value or "").strip()
    if not normalized:
        return ""
    if channel == "telegram":
        return _normalize_telegram_account(normalized)
    return _normalize_phone_number(normalized)


def _normalize_phone_number(value: str) -> str:
    normalized = value.strip()
    if normalized.lower().startswith("whatsapp:"):
        normalized = normalized.split(":", 1)[1].strip()
    return (
        normalized.replace(" ", "")
        .replace("-", "")
        .replace("(", "")
        .replace(")", "")
    )


def _normalize_telegram_account(value: str) -> str:
    normalized = value.strip()
    if normalized.lower().startswith("telegram:"):
        normalized = normalized.split(":", 1)[1].strip()
    return normalized


def _recipient_missing_label(channel: str) -> str:
    if channel == "telegram":
        return "farm_admin_profile.telegram_account or TELEGRAM_CHAT_ID"
    if channel == "whatsapp":
        return "farm_admin_profile.whatsapp_number or VERIFIED_MOBILE_NUMBER"
    return "farm_admin_profile.mobile_number or VERIFIED_MOBILE_NUMBER"


def _twilio_client(config: dict[str, str]):
    try:
        from twilio.rest import Client
    except Exception as exc:  # pragma: no cover - dependency/environment dependent
        raise ProviderDeliveryError("twilio", "twilio_sdk_missing", "Twilio Python SDK is not installed.") from exc
    return Client(config["account_sid"], config["auth_token"])


def _voice_answer_url(communication_id: str) -> str:
    public_backend_url = os.getenv("AGRIOS_PUBLIC_BACKEND_URL", "").strip().rstrip("/")
    return f"{public_backend_url}/communication/twilio/voice/answer/{quote(communication_id)}"


def _inline_call_twiml(message: str, language: str) -> str:
    locale = TWILIO_LOCALES.get(str(language or "en").strip().lower(), "en-US")
    safe_message = escape(message or "AgriOS Saathi has a farm alert. Please check the farm dashboard.")
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="{locale}">{safe_message}</Say>
</Response>"""


def _status_callback_url(communication_id: str) -> str | None:
    public_backend_url = os.getenv("AGRIOS_PUBLIC_BACKEND_URL", "").strip().rstrip("/")
    if not public_backend_url:
        return None
    return f"{public_backend_url}/communication/twilio/status/{quote(communication_id)}"


def _attempt(
    channel: str,
    provider: str,
    status: str,
    reason: str | None = None,
    error: str | None = None,
    provider_status: str | None = None,
) -> dict[str, Any]:
    return {
        "channel": channel,
        "provider": provider,
        "status": status,
        "providerStatus": provider_status,
        "reason": reason,
        "error": error,
        "attemptedAt": server_now_iso(),
    }


def _first_value(items: list[dict[str, Any]], key: str) -> Any:
    return next((item.get(key) for item in items if item.get(key)), None)


def _cache_communication(communication: dict[str, Any]) -> None:
    _COMMUNICATION_CACHE[communication["communicationId"]] = dict(communication)


def _safe_provider_error(exc: Exception) -> str:
    message = str(exc) or exc.__class__.__name__
    for secret_key in ["TWILIO_AUTH_TOKEN", "TWILIO_ACCOUNT_SID", "TELEGRAM_BOT_TOKEN", "BOT_TOKEN"]:
        secret = os.getenv(secret_key, "")
        if secret:
            message = message.replace(secret, "[redacted]")
    return message[:240]
