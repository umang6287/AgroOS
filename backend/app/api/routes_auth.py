import os
from typing import Any
from urllib.parse import urlparse

from fastapi import APIRouter, Cookie, Depends, Header, HTTPException, Response
from pydantic import BaseModel, Field

from app.api.auth_dependencies import require_admin
from app.services.ai_config_service import persist_openai_key, validate_openai_key
from app.services.auth_service import (
    SESSION_COOKIE_NAME,
    SESSION_DAYS,
    AuthError,
    auth_status,
    authenticate_admin,
    create_admin_profile,
    create_session,
    delete_session,
    get_profile_for_session,
    update_admin_profile,
)


router = APIRouter(prefix="/auth", tags=["auth"])


class AdminSetupRequest(BaseModel):
    userId: str = Field(min_length=1)
    password: str = Field(min_length=1)
    firstName: str = Field(min_length=1)
    lastName: str = Field(min_length=1)
    whatsappNumber: str | None = None
    mobileNumber: str | None = None
    telegramAccount: str | None = None
    apiKey: str | None = None


class AdminLoginRequest(BaseModel):
    userId: str = Field(min_length=1)
    password: str = Field(min_length=1)


class AdminProfileUpdateRequest(BaseModel):
    firstName: str | None = None
    lastName: str | None = None
    whatsappNumber: str | None = None
    mobileNumber: str | None = None
    telegramAccount: str | None = None
    password: str | None = None
    apiKey: str | None = None


@router.get("/status")
def get_auth_status(
    agrios_session: str | None = Cookie(default=None, alias=SESSION_COOKIE_NAME),
    authorization: str | None = Header(default=None),
):
    return auth_status(agrios_session or _bearer_token(authorization))


@router.get("/me")
def get_me(
    agrios_session: str | None = Cookie(default=None, alias=SESSION_COOKIE_NAME),
    authorization: str | None = Header(default=None),
):
    profile = get_profile_for_session(agrios_session or _bearer_token(authorization))
    if not profile:
        raise HTTPException(status_code=401, detail="Farm admin login required.")
    return {"user": profile}


@router.post("/setup")
def setup_admin(request: AdminSetupRequest, response: Response):
    api_key_validation = _validate_optional_api_key(request.apiKey)
    try:
        profile = create_admin_profile(_model_dump(request, exclude={"apiKey"}))
        token, expires_at = create_session(profile["userId"])
    except AuthError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    api_key_result = _persist_validated_api_key(request.apiKey, api_key_validation)
    _apply_api_key_status(profile, api_key_result)
    _set_session_cookie(response, token)
    return {
        "setupComplete": True,
        "authenticated": True,
        "user": profile,
        "sessionExpiresAt": expires_at,
        "sessionToken": token,
        "openAiKey": api_key_result,
    }


@router.post("/login")
def login_admin(request: AdminLoginRequest, response: Response):
    profile = authenticate_admin(request.userId, request.password)
    if not profile:
        raise HTTPException(status_code=401, detail="Invalid user ID or password.")

    token, expires_at = create_session(profile["userId"])
    _set_session_cookie(response, token)
    return {"authenticated": True, "user": profile, "sessionExpiresAt": expires_at, "sessionToken": token}


@router.post("/logout")
def logout_admin(response: Response, agrios_session: str | None = Cookie(default=None, alias=SESSION_COOKIE_NAME)):
    delete_session(agrios_session)
    response.delete_cookie(SESSION_COOKIE_NAME, path="/")
    return {"authenticated": False}


@router.patch("/profile")
def update_profile(request: AdminProfileUpdateRequest, admin: dict = Depends(require_admin)):
    api_key_validation = _validate_optional_api_key(request.apiKey)
    payload = _model_dump(request, exclude_unset=True, exclude={"apiKey"})
    try:
        profile = update_admin_profile(admin["userId"], payload)
    except AuthError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    api_key_result = _persist_validated_api_key(request.apiKey, api_key_validation)
    _apply_api_key_status(profile, api_key_result)
    return {"user": profile, "openAiKey": api_key_result}


def _validate_optional_api_key(api_key: str | None) -> dict[str, Any] | None:
    normalized = (api_key or "").strip()
    if not normalized:
        return None
    validation = validate_openai_key(normalized)
    if not validation["valid"]:
        raise HTTPException(status_code=400, detail=validation["message"])
    return validation


def _persist_validated_api_key(api_key: str | None, validation: dict[str, Any] | None) -> dict[str, Any] | None:
    normalized = (api_key or "").strip()
    if not normalized or validation is None:
        return None
    return {"status": persist_openai_key(normalized), "validation": validation}


def _apply_api_key_status(profile: dict[str, Any], api_key_result: dict[str, Any] | None) -> None:
    if api_key_result and isinstance(api_key_result.get("status"), dict):
        profile["hasOpenAiKey"] = bool(api_key_result["status"].get("configured"))


def _model_dump(model: BaseModel, **kwargs):
    if hasattr(model, "model_dump"):
        return model.model_dump(**kwargs)
    return model.dict(**kwargs)


def _set_session_cookie(response: Response, token: str) -> None:
    same_site, secure = _session_cookie_policy()
    response.set_cookie(
        SESSION_COOKIE_NAME,
        token,
        httponly=True,
        secure=secure,
        samesite=same_site,
        max_age=SESSION_DAYS * 24 * 60 * 60,
        path="/",
    )


def _session_cookie_policy() -> tuple[str, bool]:
    frontend_url = os.getenv("FRONTEND_URL", "")
    parsed = urlparse(frontend_url)
    if parsed.scheme == "https":
        return "none", True
    return "lax", False


def _bearer_token(authorization: str | None) -> str | None:
    if not authorization:
        return None
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        return None
    return token.strip()
