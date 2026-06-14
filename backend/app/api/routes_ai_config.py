from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.api.auth_dependencies import require_admin
from app.services.ai_config_service import get_ai_config_status, persist_openai_key, validate_openai_key


router = APIRouter(prefix="/ai/config", tags=["ai-config"])


class OpenAIKeyRequest(BaseModel):
    apiKey: str = Field(min_length=1)
    validateKey: bool = True


class OpenAIValidateRequest(BaseModel):
    apiKey: str | None = None


@router.get("/status")
def get_status():
    return get_ai_config_status()


@router.post("/validate")
def validate_key(request: OpenAIValidateRequest | None = None, _admin: dict = Depends(require_admin)):
    body = request or OpenAIValidateRequest()
    return validate_openai_key(body.apiKey)


@router.post("/openai-key")
def save_openai_key(request: OpenAIKeyRequest, _admin: dict = Depends(require_admin)):
    validation = validate_openai_key(request.apiKey) if request.validateKey else {"valid": True, "message": "Stored without live validation."}
    if not validation["valid"]:
        raise HTTPException(status_code=400, detail=validation["message"])

    try:
        status = persist_openai_key(request.apiKey)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    return {**status, "validation": validation}
