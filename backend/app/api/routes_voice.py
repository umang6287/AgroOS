from fastapi import APIRouter, Body, Depends, HTTPException, Query, Request, Response
from pydantic import BaseModel, Field

from app.agents.supervisor_agent import run_voice_workflow
from app.api.auth_dependencies import require_admin
from app.services.openai_service import (
    RealtimeSessionError,
    create_realtime_call_answer_sdp,
    decode_audio_base64,
    transcribe_audio,
)

router = APIRouter(prefix="/voice", tags=["voice"])


class VoiceAskRequest(BaseModel):
    prompt: str | None = "Call my farm"
    language: str = "en"
    includeAudio: bool = False
    audioBase64: str | None = None
    audioFilename: str | None = None
    conversationId: str | None = None
    history: list[dict] = Field(default_factory=list)


@router.post("/ask")
def ask_farm_manager(request: VoiceAskRequest | None = Body(default=None), _admin: dict = Depends(require_admin)):
    body = request if isinstance(request, VoiceAskRequest) else VoiceAskRequest()
    transcription = None
    prompt = body.prompt or "Call my farm"
    if body.audioBase64:
        transcription = transcribe_audio(
            decode_audio_base64(body.audioBase64),
            filename=body.audioFilename or "farmer-message.webm",
            language=body.language,
        )
        if transcription.get("text"):
            prompt = transcription["text"]

    _, result = run_voice_workflow(
        prompt,
        body.language,
        body.includeAudio,
        transcription=transcription,
        conversation_id=body.conversationId,
        history=body.history,
    )
    return result


@router.post("/realtime/session")
async def create_realtime_voice_session(
    request: Request,
    language: str = Query(default="en"),
    callSign: str = Query(default="AGRIOS-LIVE-01"),
    admin: dict = Depends(require_admin),
):
    offer_sdp = (await request.body()).decode("utf-8", errors="replace")
    try:
        answer_sdp = create_realtime_call_answer_sdp(
            offer_sdp=offer_sdp,
            language=language,
            call_sign=callSign,
            safety_user_id=str(admin.get("userId") or callSign),
        )
    except RealtimeSessionError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    return Response(content=answer_sdp, media_type="application/sdp")
