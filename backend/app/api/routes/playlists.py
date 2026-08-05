import httpx
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from ...core.session_store import session_store
from ...services import spotify_oauth
from .auth import SESSION_COOKIE_NAME

router = APIRouter()

SPOTIFY_SERVICE_KEY = "spotify"


class PlaylistOut(BaseModel):
    id: str
    name: str
    cover_url: str | None = None
    track_count: int
    owner: str
    migratable: bool
    description: str | None = None


class TrackOut(BaseModel):
    id: str | None = None
    name: str
    artist: str
    duration_ms: int | None = None


@router.get(
    "/playlists",
    name="spotify_playlists",
    tags=["playlists"],
    response_model=list[PlaylistOut],
)
async def spotify_playlists(request: Request) -> list[PlaylistOut]:
    session_id = request.cookies.get(SESSION_COOKIE_NAME)
    session = session_store.get(session_id) if session_id else None
    token = session.platform_tokens.get(SPOTIFY_SERVICE_KEY) if session else None
    if token is None:
        raise HTTPException(status_code=401, detail="spotify not connected")

    try:
        playlists = await spotify_oauth.list_playlists(token.access_token)
    except httpx.HTTPStatusError as error:
        raise HTTPException(
            status_code=502,
            detail=f"spotify api error: {error.response.status_code}",
        ) from error

    return [
        PlaylistOut(
            id=playlist.id,
            name=playlist.name,
            cover_url=playlist.cover_url,
            track_count=playlist.track_count,
            owner=playlist.owner_name,
            migratable=playlist.migratable,
            description=playlist.description,
        )
        for playlist in playlists
    ]


@router.get(
    "/playlists/{playlist_id}/tracks",
    name="spotify_playlist_tracks",
    tags=["playlists"],
    response_model=list[TrackOut],
)
async def spotify_playlist_tracks(request: Request, playlist_id: str) -> list[TrackOut]:
    session_id = request.cookies.get(SESSION_COOKIE_NAME)
    session = session_store.get(session_id) if session_id else None
    token = session.platform_tokens.get(SPOTIFY_SERVICE_KEY) if session else None
    if token is None:
        raise HTTPException(status_code=401, detail="spotify not connected")

    try:
        tracks = await spotify_oauth.list_tracks(token.access_token, playlist_id)
    except httpx.HTTPStatusError as error:
        raise HTTPException(
            status_code=502,
            detail=f"spotify api error: {error.response.status_code}",
        ) from error

    return [
        TrackOut(
            id=track.id,
            name=track.name,
            artist=track.artist,
            duration_ms=track.duration_ms,
        )
        for track in tracks
    ]
