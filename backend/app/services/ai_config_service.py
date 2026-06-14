import os
import sys
from pathlib import Path
from typing import Any

from dotenv import load_dotenv


BACKEND_DIR = Path(__file__).resolve().parents[2]
ENV_FILE = BACKEND_DIR / ".env"

DEFAULT_OPENAI_MODEL = "gpt-5.2"
DEFAULT_STT_MODEL = "gpt-4o-mini-transcribe"
DEFAULT_TTS_MODEL = "gpt-4o-mini-tts"
DEFAULT_TTS_VOICE = "alloy"
DEFAULT_REALTIME_MODEL = "gpt-realtime-2"
DEFAULT_REALTIME_VOICE = "marin"


def load_backend_env() -> None:
    load_dotenv(ENV_FILE, override=False)


load_backend_env()


def is_openai_live_enabled() -> bool:
    if "pytest" in sys.modules:
        return False
    return os.getenv("OPENAI_LIVE_ENABLED", "true").strip().lower() not in {"0", "false", "no", "off"}


def get_openai_api_key() -> str:
    load_backend_env()
    return os.getenv("OPENAI_API_KEY", "").strip()


def get_openai_model() -> str:
    return os.getenv("OPENAI_MODEL", DEFAULT_OPENAI_MODEL).strip() or DEFAULT_OPENAI_MODEL


def get_stt_model() -> str:
    return os.getenv("OPENAI_STT_MODEL", DEFAULT_STT_MODEL).strip() or DEFAULT_STT_MODEL


def get_tts_model() -> str:
    return os.getenv("OPENAI_TTS_MODEL", DEFAULT_TTS_MODEL).strip() or DEFAULT_TTS_MODEL


def get_tts_voice() -> str:
    return os.getenv("OPENAI_TTS_VOICE", DEFAULT_TTS_VOICE).strip() or DEFAULT_TTS_VOICE


def get_realtime_model() -> str:
    return os.getenv("OPENAI_REALTIME_MODEL", DEFAULT_REALTIME_MODEL).strip() or DEFAULT_REALTIME_MODEL


def get_realtime_voice() -> str:
    return os.getenv("OPENAI_REALTIME_VOICE", DEFAULT_REALTIME_VOICE).strip() or DEFAULT_REALTIME_VOICE


def get_openai_timeout_seconds() -> float:
    raw_value = os.getenv("AGRIOS_OPENAI_TIMEOUT_SECONDS", "8").strip()
    try:
        return max(1.0, float(raw_value))
    except ValueError:
        return 8.0


def get_ai_config_status() -> dict[str, Any]:
    configured = bool(get_openai_api_key())
    live_enabled = is_openai_live_enabled()
    return {
        "configured": configured,
        "ready": configured and live_enabled,
        "liveEnabled": live_enabled,
        "source": "backend_env" if configured else None,
        "model": get_openai_model(),
        "speechToTextModel": get_stt_model(),
        "textToSpeechModel": get_tts_model(),
        "textToSpeechVoice": get_tts_voice(),
        "realtimeModel": get_realtime_model(),
        "realtimeVoice": get_realtime_voice(),
    }


def is_potential_openai_key(api_key: str) -> bool:
    normalized = api_key.strip()
    return normalized.startswith("sk-") and len(normalized) >= 40


def persist_openai_key(api_key: str) -> dict[str, Any]:
    normalized = api_key.strip()
    if not is_potential_openai_key(normalized):
        raise ValueError("The OpenAI key format is not valid.")

    os.environ["OPENAI_API_KEY"] = normalized
    if not os.getenv("VERCEL"):
        _set_env_value("OPENAI_API_KEY", normalized)
    return get_ai_config_status()


def validate_openai_key(api_key: str | None = None) -> dict[str, Any]:
    key = (api_key or get_openai_api_key()).strip()
    if not is_potential_openai_key(key):
        return {"valid": False, "message": "The OpenAI key format is not valid."}

    if not is_openai_live_enabled():
        return {"valid": True, "message": "OpenAI live validation is disabled in this runtime."}

    try:
        from openai import OpenAI

        client = OpenAI(api_key=key, timeout=get_openai_timeout_seconds())
        client.models.list()
        return {"valid": True, "message": "OpenAI key validated."}
    except Exception as exc:  # pragma: no cover - network/provider dependent
        return {"valid": False, "message": _safe_provider_error(exc)}


def _safe_provider_error(exc: Exception) -> str:
    message = str(exc)
    if not message:
        return "OpenAI validation failed."
    redacted = message.replace(get_openai_api_key(), "[redacted]") if get_openai_api_key() else message
    return redacted[:240]


def _set_env_value(key: str, value: str) -> None:
    ENV_FILE.parent.mkdir(parents=True, exist_ok=True)
    lines = ENV_FILE.read_text(encoding="utf-8").splitlines() if ENV_FILE.exists() else []
    next_lines: list[str] = []
    replaced = False

    for line in lines:
        if line.startswith(f"{key}="):
            next_lines.append(f"{key}={value}")
            replaced = True
        else:
            next_lines.append(line)

    if not replaced:
        next_lines.append(f"{key}={value}")

    ENV_FILE.write_text("\n".join(next_lines).rstrip() + "\n", encoding="utf-8")
