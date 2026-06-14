from fastapi import Cookie, HTTPException

from app.services.auth_service import SESSION_COOKIE_NAME, get_profile_for_session


def require_admin(agrios_session: str | None = Cookie(default=None, alias=SESSION_COOKIE_NAME)) -> dict:
    profile = get_profile_for_session(agrios_session)
    if not profile:
        raise HTTPException(status_code=401, detail="Farm admin login required.")
    return profile
