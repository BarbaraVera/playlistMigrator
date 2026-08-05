import logging
from threading import Lock
from typing import Any

import httpx
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from ...core.session_store import session_store
from ...services import spotify_oauth, youtube_oauth
from .auth import SESSION_COOKIE_NAME

logger = logging.getLogger(__name__)

router = APIRouter()

SPOTIFY_SERVICE_KEY = "spotify"
YOUTUBE_SERVICE_KEY = "youtube-music"

MAX_PLAYLISTS_PER_TRANSFER = 3


class TransferProgressStore:
    """Progreso en memoria de las migraciones activas, keyed by session."""

    def __init__(self) -> None:
        self._progress: dict[str, list[dict[str, Any]]] = {}
        self._lock = Lock()

    def start(self, session_id: str, playlist_ids: list[str]) -> None:
        with self._lock:
            self._progress[session_id] = [
                {"playlist_id": playlist_id, "total_tracks": 0, "processed_tracks": 0}
                for playlist_id in playlist_ids
            ]

    def set_total(self, session_id: str, playlist_id: str, total_tracks: int) -> None:
        with self._lock:
            for entry in self._progress.get(session_id, []):
                if entry["playlist_id"] == playlist_id:
                    entry["total_tracks"] = total_tracks
                    return

    def tick(self, session_id: str, playlist_id: str) -> None:
        with self._lock:
            for entry in self._progress.get(session_id, []):
                if entry["playlist_id"] == playlist_id:
                    entry["processed_tracks"] += 1
                    return

    def get(self, session_id: str) -> list[dict[str, Any]]:
        with self._lock:
            return list(self._progress.get(session_id, []))

    def clear(self, session_id: str) -> None:
        with self._lock:
            self._progress.pop(session_id, None)


transfer_progress_store = TransferProgressStore()


class TransferRequest(BaseModel):
    playlist_ids: list[str] = []


class TransferPlaylistResult(BaseModel):
    playlist_id: str
    title: str
    youtube_playlist_id: str
    youtube_url: str
    total_tracks: int
    successful_tracks: int
    failed_tracks: int


class TransferResponse(BaseModel):
    playlists_migrated: int
    total_tracks: int
    successful_tracks: int
    failed_tracks: int
    results: list[TransferPlaylistResult]


class TransferProgressPlaylist(BaseModel):
    playlist_id: str
    total_tracks: int
    processed_tracks: int


def _api_error_detail(error: httpx.HTTPStatusError) -> dict[str, Any]:
    """Estructura el error de la API de Spotify/YouTube en JSON claro."""
    response = error.response
    try:
        body = response.json()
    except Exception:
        body = {}

    message = response.text or str(error)
    status_code = response.status_code
    api_status = None
    api_error = body.get("error") if isinstance(body, dict) else None
    if isinstance(api_error, dict):
        message = api_error.get("message") or message
        status_code = api_error.get("code") or status_code
        api_status = api_error.get("status")
    elif isinstance(body, dict) and body.get("error_description"):
        message = body["error_description"]

    request = response.request
    return {
        "error": "api_error",
        "message": message,
        "status_code": status_code,
        "status": api_status,
        "method": request.method if request is not None else None,
        "endpoint": str(request.url.path) if request is not None else None,
    }


async def _fresh_access_token(
    session: Any,
    service: Any,
    key: str,
) -> str | None:
    token = session.platform_tokens.get(key)
    if token is None:
        return None
    refresh_token = getattr(token, "refresh_token", None)
    if not refresh_token:
        return token.access_token
    try:
        fresh = await service.refresh_token(refresh_token)
    except Exception:
        logger.warning("token refresh failed for %s, falling back to stored token", key, exc_info=True)
        fresh = token
    if fresh is not token:
        session.set_platform_token(key, fresh)
    return fresh.access_token


async def _migrate_playlist(
    playlist_id: str,
    spotify_access: str,
    youtube_access: str,
    session_id: str,
) -> TransferPlaylistResult:
    logger.info("migrating playlist %s from spotify", playlist_id)
    playlist = await spotify_oauth.get_playlist(spotify_access, playlist_id)
    tracks = await spotify_oauth.list_tracks(spotify_access, playlist_id)
    logger.info("playlist %s has %d tracks", playlist_id, len(tracks))
    transfer_progress_store.set_total(session_id, playlist_id, len(tracks))

    youtube_playlist_id = await youtube_oauth.create_playlist(
        youtube_access,
        title=playlist.name,
        description=playlist.description,
    )
    logger.info("created youtube playlist %s for %s", youtube_playlist_id, playlist_id)

    successful_tracks = 0
    for index, track in enumerate(tracks):
        transfer_progress_store.tick(session_id, playlist_id)
        try:
            video_id = await youtube_oauth.search_video(
                youtube_access,
                f"{track.name} {track.artist}",
            )
            if video_id is None:
                continue
            await youtube_oauth.add_playlist_item(
                youtube_access,
                youtube_playlist_id,
                video_id,
                position=index,
            )
            successful_tracks += 1
        except httpx.HTTPStatusError as error:
            if error.response.status_code in (401, 403):
                logger.warning(
                    "youtube api rejected track %r while migrating %s",
                    track.name,
                    playlist_id,
                    exc_info=True,
                )
                raise
            continue

    logger.info(
        "playlist %s migrated: %d/%d ok",
        playlist_id,
        successful_tracks,
        len(tracks),
    )
    return TransferPlaylistResult(
        playlist_id=playlist_id,
        title=playlist.name,
        youtube_playlist_id=youtube_playlist_id,
        youtube_url=f"https://music.youtube.com/playlist?list={youtube_playlist_id}",
        total_tracks=len(tracks),
        successful_tracks=successful_tracks,
        failed_tracks=len(tracks) - successful_tracks,
    )


@router.post(
    "/transfer",
    name="transfer",
    tags=["transfer"],
    response_model=TransferResponse,
)
async def transfer(request: Request, body: TransferRequest) -> TransferResponse:
    if not body.playlist_ids:
        raise HTTPException(status_code=400, detail="playlist_ids is required")
    if len(body.playlist_ids) > MAX_PLAYLISTS_PER_TRANSFER:
        raise HTTPException(
            status_code=400,
            detail=f"máximo {MAX_PLAYLISTS_PER_TRANSFER} playlists por migración",
        )

    session_id = request.cookies.get(SESSION_COOKIE_NAME)
    session = session_store.get(session_id) if session_id else None

    if session is None or session.platform_tokens.get(SPOTIFY_SERVICE_KEY) is None:
        raise HTTPException(status_code=401, detail="spotify not connected")
    if session.platform_tokens.get(YOUTUBE_SERVICE_KEY) is None:
        raise HTTPException(status_code=401, detail="youtube-music not connected")

    try:
        spotify_access = await _fresh_access_token(session, spotify_oauth, SPOTIFY_SERVICE_KEY)
        youtube_access = await _fresh_access_token(session, youtube_oauth, YOUTUBE_SERVICE_KEY)

        transfer_progress_store.start(session_id, body.playlist_ids)

        results: list[TransferPlaylistResult] = []
        for playlist_id in body.playlist_ids:
            try:
                result = await _migrate_playlist(
                    playlist_id,
                    spotify_access,
                    youtube_access,
                    session_id,
                )
            except httpx.HTTPStatusError as error:
                logger.exception("transfer api error while migrating playlist %s", playlist_id)
                raise HTTPException(
                    status_code=502,
                    detail={"playlist_id": playlist_id, **_api_error_detail(error)},
                ) from error
            results.append(result)

        return TransferResponse(
            playlists_migrated=len(results),
            total_tracks=sum(result.total_tracks for result in results),
            successful_tracks=sum(result.successful_tracks for result in results),
            failed_tracks=sum(result.failed_tracks for result in results),
            results=results,
        )
    except HTTPException:
        raise
    except Exception as error:
        logger.exception("unexpected error in POST /api/transfer")
        raise HTTPException(
            status_code=500,
            detail={"error": "internal_error", "message": str(error)},
        ) from error
    finally:
        transfer_progress_store.clear(session_id)


@router.get(
    "/transfer/progress",
    name="transfer_progress",
    tags=["transfer"],
    response_model=list[TransferProgressPlaylist],
)
async def transfer_progress(request: Request) -> list[TransferProgressPlaylist]:
    session_id = request.cookies.get(SESSION_COOKIE_NAME)
    session = session_store.get(session_id) if session_id else None

    if session is None:
        raise HTTPException(status_code=401, detail="not connected")

    return [
        TransferProgressPlaylist(**entry)
        for entry in transfer_progress_store.get(session_id)
    ]
