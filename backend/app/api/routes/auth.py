from typing import Any
from urllib.parse import urlencode

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse, RedirectResponse

from ...config import get_settings
from ...core.session_store import session_store
from ...core.state_store import state_store
from ...services import OAUTH_SERVICES, BaseOAuthService

router = APIRouter()

SESSION_COOKIE_NAME = "plm_session"
FRONTEND_STATUS_PATH = "/connect"

PLATFORM_ALIASES: dict[str, str] = {
    "spotify": "spotify",
    "youtube": "youtube-music",
    "youtube-music": "youtube-music",
}

SERVICE_ROUTE_NAMES: dict[str, str] = {
    "spotify": "spotify",
    "youtube-music": "youtube",
}

settings = get_settings()


def _service_key(platform: str) -> str | None:
    return PLATFORM_ALIASES.get(platform)


def _route_name(service_key: str) -> str:
    return SERVICE_ROUTE_NAMES.get(service_key, service_key)


def _frontend_url(status: str, platform: str, error: str | None = None) -> str:
    params: dict[str, str] = {"status": status, "platform": platform}
    if error:
        params["message"] = error
    return f"{settings.frontend_base_url}{FRONTEND_STATUS_PATH}?{urlencode(params)}"


def _redirect_to_frontend(
    status: str, platform: str, error: str | None = None
) -> RedirectResponse:
    return RedirectResponse(_frontend_url(status, platform, error), status_code=303)


@router.get("/{platform}/login", name="auth_login", tags=["auth"])
async def login(platform: str) -> RedirectResponse:
    key = _service_key(platform)
    if key is None:
        return _redirect_to_frontend("error", platform, "unsupported platform")

    service = OAUTH_SERVICES[key]
    state = state_store.create(key)
    return RedirectResponse(service.authorization_url(state), status_code=303)


@router.get("/{platform}/callback", name="auth_callback", tags=["auth"])
async def callback(platform: str, code: str, state: str, request: Request) -> RedirectResponse:
    key = _service_key(platform)
    route_name = _route_name(platform) if key is None else _route_name(key)

    if key is None:
        return _redirect_to_frontend("error", route_name, "unsupported platform")

    if not state_store.consume(state, key):
        return _redirect_to_frontend("error", route_name, "invalid state")

    service = OAUTH_SERVICES[key]
    try:
        token = await service.exchange_code(code)
    except Exception:
        return _redirect_to_frontend("error", route_name, "token exchange failed")

    session_id = request.cookies.get(SESSION_COOKIE_NAME)
    session = session_store.get(session_id) if session_id else None
    if session is None:
        session_id = session_store.create()
        session = session_store.get(session_id)

    session.set_platform_token(key, token)

    response = _redirect_to_frontend("success", route_name)
    response.set_cookie(
        SESSION_COOKIE_NAME,
        session_id,
        max_age=settings.session_ttl_seconds,
        httponly=True,
        secure=False,
        samesite="lax",
    )
    return response


@router.get("/me", name="auth_me", tags=["auth"])
def me(request: Request) -> dict[str, Any]:
    session_id = request.cookies.get(SESSION_COOKIE_NAME)
    session = session_store.get(session_id) if session_id else None
    connected = [_route_name(key) for key in session.connected_platforms()] if session else []
    return {"connected_platforms": connected}


@router.post("/{platform}/disconnect", name="auth_disconnect", tags=["auth"])
def disconnect(platform: str, request: Request) -> JSONResponse:
    key = _service_key(platform)
    if key is None:
        return JSONResponse({"detail": "unsupported platform"}, status_code=404)

    session_id = request.cookies.get(SESSION_COOKIE_NAME)
    session = session_store.get(session_id) if session_id else None
    if session is None:
        return JSONResponse({"connected_platforms": []})

    session.remove_platform_token(key)
    connected = [_route_name(service_key) for service_key in session.connected_platforms()]

    response = JSONResponse({"connected_platforms": connected})
    if not connected:
        session_store.remove(session_id)
        response.delete_cookie(
            SESSION_COOKIE_NAME,
            httponly=True,
            secure=False,
            samesite="lax",
        )
    return response
