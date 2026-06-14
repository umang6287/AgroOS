from __future__ import annotations

from html import escape
from typing import Any
from uuid import uuid4
from urllib.parse import parse_qs, quote

from fastapi import APIRouter, Body, Depends, HTTPException, Query, Request
from fastapi.responses import Response
from pydantic import BaseModel, Field

from app.api.auth_dependencies import require_admin
from app.agents.language import normalize_language
from app.agents.supervisor_agent import run_voice_workflow
from app.demo_store import get_communication_events, record_communication_event, server_now_iso
from app.services.communication_gateway import get_cached_communication, record_provider_status
from app.services.communication_gateway import send_message


router = APIRouter(tags=["communication"])

TWILIO_LOCALES = {
    "en": "en-US",
    "mr": "mr-IN",
    "hi": "hi-IN",
    "gu": "gu-IN",
}
DEFAULT_TEST_CHANNELS = ["whatsapp", "telegram", "sms", "phone_call"]
REAL_DELIVERY_CONFIRMATION = "SEND_REAL_COMMUNICATIONS"
CHANNEL_ALIASES = {
    "call": "phone_call",
    "phone": "phone_call",
    "voice": "phone_call",
    "text": "sms",
    "text_message": "sms",
}


class CommunicationTestRequest(BaseModel):
    channels: list[str] = Field(default_factory=lambda: DEFAULT_TEST_CHANNELS.copy())
    realDelivery: bool = False
    confirmation: str | None = None
    message: str | None = None
    language: str = "en"
    recipientRole: str = "farmer"


@router.get("/communications")
def list_communications(limit: int = Query(default=60, ge=1, le=240), _admin: dict = Depends(require_admin)):
    return get_communication_events(limit=limit)


@router.post("/communications/test")
def test_communications(
    request: CommunicationTestRequest | None = Body(default=None),
    _admin: dict = Depends(require_admin),
):
    body = request if isinstance(request, CommunicationTestRequest) else CommunicationTestRequest()
    channels = _normalize_channels(body.channels)
    language = normalize_language(body.language)

    if body.realDelivery and body.confirmation != REAL_DELIVERY_CONFIRMATION:
        raise HTTPException(
            status_code=400,
            detail=f'Real delivery requires confirmation "{REAL_DELIVERY_CONFIRMATION}".',
        )

    communications = [
        _send_test_communication(
            channel,
            real_delivery=body.realDelivery,
            message=body.message,
            language=language,
            recipient_role=body.recipientRole,
        )
        for channel in channels
    ]

    return {
        "status": "completed",
        "realDelivery": body.realDelivery,
        "channels": channels,
        "summary": _test_summary(communications, body.realDelivery),
        "communications": communications,
    }


@router.post("/communication/twilio/voice/answer/{communication_id}")
def answer_twilio_call(communication_id: str):
    communication = get_cached_communication(communication_id) or {}
    language = normalize_language(communication.get("language"))
    message = communication.get("message") or "AgriOS Saathi has a critical farm alert. Please check the farm dashboard."
    return _twiml_response(_gather_twiml(message, language, communication_id))


@router.post("/communication/twilio/voice/respond/{communication_id}")
async def respond_to_twilio_speech(communication_id: str, request: Request):
    form = await _read_twilio_form(request)
    communication = get_cached_communication(communication_id) or {}
    language = normalize_language(communication.get("language"))
    prompt = form.get("SpeechResult") or form.get("Digits") or "Please repeat the farm alert."
    _, result = run_voice_workflow(prompt, language=language, include_audio=False)
    answer = result.get("data", {}).get("responseText") or result.get("summary") or "AgriOS Saathi checked the farm state."
    return _twiml_response(_gather_twiml(answer, language, communication_id))


@router.post("/communication/twilio/status/{communication_id}")
async def record_twilio_status(communication_id: str, request: Request):
    payload = await _read_twilio_form(request)
    communication = record_provider_status(communication_id, payload)
    return {"communicationId": communication_id, "status": communication.get("status"), "providerStatus": communication.get("providerStatus")}


async def _read_twilio_form(request: Request) -> dict[str, str]:
    raw_body = (await request.body()).decode("utf-8", errors="replace")
    parsed = parse_qs(raw_body)
    return {key: values[0] for key, values in parsed.items() if values}


def _gather_twiml(message: str, language: str, communication_id: str) -> str:
    locale = TWILIO_LOCALES.get(normalize_language(language), "en-US")
    action = f"/communication/twilio/voice/respond/{quote(communication_id)}"
    safe_message = escape(message)
    follow_up = escape("You can ask a follow-up question after the beep.")
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="{locale}">{safe_message}</Say>
  <Gather input="speech dtmf" language="{locale}" action="{action}" method="POST" speechTimeout="auto">
    <Say language="{locale}">{follow_up}</Say>
  </Gather>
  <Say language="{locale}">No question received. AgriOS Saathi will keep monitoring the farm.</Say>
</Response>"""


def _twiml_response(twiml: str) -> Response:
    return Response(content=twiml, media_type="application/xml")


def _normalize_channels(raw_channels: list[str]) -> list[str]:
    channels: list[str] = []
    invalid: list[str] = []
    for raw_channel in raw_channels or DEFAULT_TEST_CHANNELS:
        normalized = CHANNEL_ALIASES.get(str(raw_channel).strip().lower(), str(raw_channel).strip().lower())
        if normalized not in DEFAULT_TEST_CHANNELS:
            invalid.append(str(raw_channel))
            continue
        if normalized not in channels:
            channels.append(normalized)

    if invalid:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported communication channel(s): {', '.join(invalid)}.",
        )
    if not channels:
        raise HTTPException(status_code=400, detail="At least one communication channel is required.")
    return channels


def _send_test_communication(
    channel: str,
    *,
    real_delivery: bool,
    message: str | None,
    language: str,
    recipient_role: str,
) -> dict[str, Any]:
    communication_id = f"comm-test-{channel}-{uuid4().hex[:10]}"
    request = {
        "communicationId": communication_id,
        "runId": "run-communication-test",
        "actionId": f"act-communication-test-{channel}",
        "severity": "warning",
        "preferredChannels": [channel],
        "selectedChannel": channel,
        "recipientRole": recipient_role,
        "message": message or _default_test_message(channel),
        "language": language,
        "createdAt": server_now_iso(),
        "deliveryMode": "real" if real_delivery else "simulated",
        "allowFallback": False,
        "testMode": True,
    }

    if real_delivery:
        communication = send_message(request)
    else:
        communication = _simulated_test_communication(request)

    return record_communication_event(communication)


def _simulated_test_communication(request: dict[str, Any]) -> dict[str, Any]:
    return {
        **request,
        "status": "simulated",
        "provider": "simulated",
        "providerStatus": "simulated",
        "providerMessageId": None,
        "providerCallSid": None,
        "fallbackProvider": None,
        "fallbackReason": None,
        "deliveryError": None,
        "requiresHumanReview": False,
        "deliveryAttempts": [
            {
                "channel": request["selectedChannel"],
                "provider": "simulated",
                "status": "simulated",
                "providerStatus": "simulated",
                "attemptedAt": server_now_iso(),
            }
        ],
        "warnings": ["fallback:simulated_delivery"],
    }


def _default_test_message(channel: str) -> str:
    channel_label = "phone call" if channel == "phone_call" else channel.replace("_", " ")
    return f"AgriOS Saathi backend test for {channel_label}. This is a one-time communication test."


def _test_summary(communications: list[dict[str, Any]], real_delivery: bool) -> str:
    delivery_word = "sent" if real_delivery else "simulated"
    channel_list = ", ".join(event["selectedChannel"] for event in communications)
    failed = [event["selectedChannel"] for event in communications if event.get("status") == "failed"]
    if failed:
        return f"Communication test attempted {channel_list}; failed channels: {', '.join(failed)}."
    return f"Communication test {delivery_word} for {channel_list}."
