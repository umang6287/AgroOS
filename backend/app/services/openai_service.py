import base64
import io
import json
import hashlib
import time
from typing import Any

import requests

from app.demo_store import get_farm_state
from app.services.ai_config_service import (
    get_ai_config_status,
    get_openai_api_key,
    get_openai_model,
    get_realtime_model,
    get_realtime_voice,
    get_openai_timeout_seconds,
    get_stt_model,
    get_tts_model,
    get_tts_voice,
    is_openai_live_enabled,
)


LANGUAGE_NAMES = {
    "en": "English",
    "mr": "Marathi",
    "hi": "Hindi",
    "gu": "Gujarati",
}

COPY_SCHEMA = {
    "type": "object",
    "properties": {
        "summary": {"type": "string"},
        "message": {"type": "string"},
        "explanation": {"type": "array", "items": {"type": "string"}},
        "items": {"type": "object", "additionalProperties": {"type": "string"}},
    },
    "required": ["summary", "message", "explanation", "items"],
    "additionalProperties": False,
}


class RealtimeSessionError(Exception):
    pass


def generate_agent_copy(
    *,
    agent: str,
    task: str,
    language: str,
    farm_context: dict[str, Any],
    fallback: dict[str, Any],
) -> dict[str, Any]:
    start = time.perf_counter()
    fallback_result = _fallback_copy(fallback, start, "fallback:static_ai_response")
    if not _can_call_openai():
        return fallback_result

    language_name = LANGUAGE_NAMES.get(language, language or "English")
    payload = {
        "agent": agent,
        "task": task,
        "targetLanguageCode": language,
        "targetLanguageName": language_name,
        "farmContext": farm_context,
        "fallbackDraft": fallback,
    }
    system_prompt = (
        "You are the AgriOS farm operations copy layer. Generate concise farmer-facing text only from the supplied "
        "farmContext and fallbackDraft. Do not invent telemetry, actions, provider delivery, weather, disease, or robot "
        "state. Match the target language exactly. Preserve safety: high-risk treatment remains an approval request. "
        "Return JSON matching the schema."
    )

    try:
        client = _openai_client()
        response = client.responses.create(
            model=get_openai_model(),
            input=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": json.dumps(payload, ensure_ascii=False, default=str)},
            ],
            text={
                "format": {
                    "type": "json_schema",
                    "name": "agrios_agent_copy",
                    "schema": COPY_SCHEMA,
                    "strict": True,
                }
            },
            store=False,
        )
        parsed = _parse_copy_response(_response_text(response))
        latency_ms = _elapsed_ms(start)
        return {
            **fallback,
            **parsed,
            "status": "completed",
            "warnings": [],
            "latencyMs": latency_ms,
            "estimatedCostUsd": _estimated_cost(response),
            "provider": "openai",
            "model": get_openai_model(),
            "fallback": False,
            "usage": _usage(response),
        }
    except Exception:
        return fallback_result


def call_openai_with_fallback(prompt):
    result = generate_agent_copy(
        agent="generic",
        task="Generate a concise AgriOS response.",
        language="en",
        farm_context={"prompt": prompt},
        fallback={"summary": "Fallback response", "message": "Fallback response", "explanation": []},
    )
    return {"text": result["message"], "fallbackUsed": result["fallback"], "prompt": prompt}


def create_realtime_call_answer_sdp(
    *,
    offer_sdp: str,
    language: str,
    call_sign: str,
    safety_user_id: str | None = None,
) -> str:
    if not offer_sdp.strip():
        raise RealtimeSessionError("WebRTC offer SDP is required.")
    if not _can_call_openai():
        raise RealtimeSessionError("OpenAI Realtime is not configured.")

    session_config = {
        "type": "realtime",
        "model": get_realtime_model(),
        "instructions": _realtime_voice_instructions(language=language, call_sign=call_sign),
        "audio": {
            "output": {
                "voice": get_realtime_voice(),
            },
        },
    }
    headers = {
        "Authorization": f"Bearer {get_openai_api_key()}",
        "OpenAI-Safety-Identifier": _safety_identifier(safety_user_id or call_sign),
    }
    files = {
        "sdp": (None, offer_sdp),
        "session": (None, json.dumps(session_config, ensure_ascii=False)),
    }

    try:
        response = requests.post(
            "https://api.openai.com/v1/realtime/calls",
            headers=headers,
            files=files,
            timeout=get_openai_timeout_seconds(),
        )
    except requests.RequestException as exc:
        raise RealtimeSessionError("OpenAI Realtime session request failed.") from exc

    if not response.ok:
        raise RealtimeSessionError(_safe_realtime_error(response.text, response.status_code))

    return response.text


def transcribe_audio(audio_bytes: bytes, *, filename: str, language: str) -> dict[str, Any]:
    start = time.perf_counter()
    if not _can_call_openai():
        return {
            "text": "",
            "language": language,
            "fallbackUsed": True,
            "warnings": ["fallback:audio_transcription_unavailable"],
            "latencyMs": _elapsed_ms(start),
        }

    try:
        client = _openai_client()
        audio_file = io.BytesIO(audio_bytes)
        audio_file.name = filename or "farmer-message.webm"
        response = client.audio.transcriptions.create(
            model=get_stt_model(),
            file=audio_file,
            language=language if language in LANGUAGE_NAMES else None,
            response_format="json",
        )
        return {
            "text": getattr(response, "text", "") or "",
            "language": language,
            "fallbackUsed": False,
            "warnings": [],
            "latencyMs": _elapsed_ms(start),
            "provider": "openai",
            "model": get_stt_model(),
        }
    except Exception:
        return {
            "text": "",
            "language": language,
            "fallbackUsed": True,
            "warnings": ["fallback:audio_transcription_unavailable"],
            "latencyMs": _elapsed_ms(start),
        }


def synthesize_speech(text: str, *, language: str) -> dict[str, Any]:
    start = time.perf_counter()
    if not text or not _can_call_openai():
        return {
            "audioUrl": None,
            "audioMimeType": None,
            "fallbackUsed": True,
            "warnings": ["fallback:text_voice_response"],
            "latencyMs": _elapsed_ms(start),
        }

    try:
        language_name = LANGUAGE_NAMES.get(language, language or "English")
        client = _openai_client()
        response = client.audio.speech.create(
            model=get_tts_model(),
            voice=get_tts_voice(),
            input=text,
            instructions=f"Speak naturally and clearly in {language_name} for a farmer operations alert.",
            response_format="mp3",
        )
        audio_bytes = response.read() if hasattr(response, "read") else getattr(response, "content", b"")
        return {
            "audioUrl": f"data:audio/mpeg;base64,{base64.b64encode(audio_bytes).decode('ascii')}",
            "audioMimeType": "audio/mpeg",
            "fallbackUsed": False,
            "warnings": [],
            "latencyMs": _elapsed_ms(start),
            "provider": "openai",
            "model": get_tts_model(),
            "voice": get_tts_voice(),
        }
    except Exception:
        return {
            "audioUrl": None,
            "audioMimeType": None,
            "fallbackUsed": True,
            "warnings": ["fallback:text_voice_response"],
            "latencyMs": _elapsed_ms(start),
        }


def decode_audio_base64(audio_base64: str) -> bytes:
    if "," in audio_base64:
        audio_base64 = audio_base64.split(",", 1)[1]
    return base64.b64decode(audio_base64)


def _can_call_openai() -> bool:
    status = get_ai_config_status()
    return bool(status["configured"] and is_openai_live_enabled())


def _openai_client():
    from openai import OpenAI

    return OpenAI(api_key=get_openai_api_key(), timeout=get_openai_timeout_seconds())


def _realtime_voice_instructions(*, language: str, call_sign: str) -> str:
    language_name = LANGUAGE_NAMES.get(language, language or "English")
    farm_state = get_farm_state()
    context = {
        "farmName": farm_state.get("name"),
        "autonomyMode": farm_state.get("autonomyMode"),
        "updatedAt": farm_state.get("updatedAt"),
        "zones": [
            {
                "id": zone.get("id"),
                "name": zone.get("name"),
                "soilMoisturePct": zone.get("soilMoisturePct"),
                "temperatureC": zone.get("temperatureC"),
                "humidityPct": zone.get("humidityPct"),
                "riskLevel": zone.get("riskLevel"),
            }
            for zone in farm_state.get("zones", [])
        ],
        "robots": farm_state.get("robots", []),
        "activeActions": farm_state.get("activeActions", []),
        "pendingApprovals": farm_state.get("pendingApprovals", []),
        "communicationEvents": (farm_state.get("communicationEvents") or [])[-3:],
        "outcomeChecks": (farm_state.get("outcomeChecks") or [])[-3:],
    }
    return (
        "# Role and Objective\n"
        "You are AgriOS Saathi, the live farm manager for an autonomous mango farm.\n"
        f"Call sign: {call_sign}.\n"
        "Answer the farmer in a calm, concise, operational voice.\n\n"
        "# Language\n"
        f"Speak in {language_name}. If the farmer switches language, follow the farmer's language when you can.\n\n"
        "# Farm Context\n"
        f"{json.dumps(context, ensure_ascii=False, default=str)}\n\n"
        "# Safety and Autonomy\n"
        "Do not claim that real-world irrigation, treatment, calling, payment, or provider delivery has happened unless the farm context says it has. "
        "High-risk treatment and irreversible actions require human approval. If you are uncertain, ask a short clarifying question.\n\n"
        "# Style\n"
        "Keep most turns to one or two short sentences. Mention the most urgent zone, pending approvals, robot state, and verified outcomes when relevant. "
        "Avoid long lists unless the farmer asks for details."
    )


def _safety_identifier(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def _safe_realtime_error(text: str, status_code: int) -> str:
    redacted = text.replace(get_openai_api_key(), "[redacted]") if get_openai_api_key() else text
    message = redacted.strip() or "OpenAI Realtime returned an error."
    return f"OpenAI Realtime returned {status_code}: {message[:240]}"


def _response_text(response: Any) -> str:
    output_text = getattr(response, "output_text", None)
    if output_text:
        return output_text

    chunks: list[str] = []
    for item in getattr(response, "output", []) or []:
        for content in getattr(item, "content", []) or []:
            text = getattr(content, "text", None)
            if text:
                chunks.append(text)
    return "\n".join(chunks)


def _parse_copy_response(text: str) -> dict[str, Any]:
    parsed = json.loads(text)
    return {
        "summary": str(parsed.get("summary", "")).strip(),
        "message": str(parsed.get("message", "")).strip(),
        "explanation": [str(item).strip() for item in parsed.get("explanation", []) if str(item).strip()][:4],
        "items": {str(key): str(value).strip() for key, value in parsed.get("items", {}).items() if str(value).strip()},
    }


def _fallback_copy(fallback: dict[str, Any], start: float, warning: str) -> dict[str, Any]:
    return {
        **fallback,
        "status": "fallback",
        "warnings": [warning],
        "latencyMs": _elapsed_ms(start),
        "estimatedCostUsd": 0.0,
        "provider": None,
        "model": None,
        "fallback": True,
        "usage": {},
        "items": fallback.get("items", {}),
    }


def _elapsed_ms(start: float) -> int:
    return max(1, int((time.perf_counter() - start) * 1000))


def _usage(response: Any) -> dict[str, int]:
    usage = getattr(response, "usage", None)
    if not usage:
        return {}
    return {
        "inputTokens": int(getattr(usage, "input_tokens", 0) or 0),
        "outputTokens": int(getattr(usage, "output_tokens", 0) or 0),
        "totalTokens": int(getattr(usage, "total_tokens", 0) or 0),
    }


def _estimated_cost(response: Any) -> float:
    usage = _usage(response)
    if not usage:
        return 0.001
    return round(max(0.0001, usage.get("totalTokens", 0) * 0.000005), 6)
