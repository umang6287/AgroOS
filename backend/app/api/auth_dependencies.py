from fastapi import Cookie, Header, HTTPException

from app.services.auth_service import SESSION_COOKIE_NAME, get_profile_for_session


def require_admin(
    agrios_session: str | None = Cookie(default=None, alias=SESSION_COOKIE_NAME),
    authorization: str | None = Header(default=None),
) -> dict:
    profile = get_profile_for_session(agrios_session or _bearer_token(authorization))
    if not profile:
        raise HTTPException(status_code=401, detail="Farm admin login required.")
    return profile


def _bearer_token(authorization: str | None) -> str | None:
    if not authorization:
        return None
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        return None
    return token.strip()
