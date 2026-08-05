from dataclasses import dataclass
from typing import Any

import httpx

from ..config import get_settings
from .base import DEFAULT_TIMEOUT, BaseOAuthService, OAuthProfile


@dataclass(frozen=True)
class SpotifyPlaylist:
    id: str
    name: str
    cover_url: str | None
    track_count: int
    owner_name: str
    owner_id: str
    collaborative: bool
    migratable: bool
    description: str | None = None


@dataclass(frozen=True)
class SpotifyTrack:
    id: str | None
    name: str
    artist: str
    duration_ms: int | None = None


class SpotifyOAuthService(BaseOAuthService):
    platform = "spotify"
    auth_url = "https://accounts.spotify.com/authorize"
    token_url = "https://accounts.spotify.com/api/token"
    userinfo_url = "https://api.spotify.com/v1/me"
    playlists_url = "https://api.spotify.com/v1/me/playlists"
    playlist_url = "https://api.spotify.com/v1/playlists"

    MAX_PLAYLISTS = 1000
    PAGE_SIZE = 50

    def __init__(self) -> None:
        settings = get_settings()
        self._client_id = settings.spotify_client_id
        self._client_secret = settings.spotify_client_secret
        self._scopes = settings.spotify_scopes.split()

    @property
    def client_id(self) -> str:
        return self._client_id

    @property
    def client_secret(self) -> str:
        return self._client_secret

    @property
    def scopes(self) -> list[str]:
        return self._scopes

    @property
    def redirect_uri(self) -> str:
        return f"{get_settings().redirect_uri_base}/spotify/callback"

    async def list_playlists(self, access_token: str) -> list[SpotifyPlaylist]:
        headers = {"Authorization": f"Bearer {access_token}"}
        playlists: list[SpotifyPlaylist] = []
        url = f"{self.playlists_url}?limit={self.PAGE_SIZE}"

        me = await self.get_profile(access_token)

        async with httpx.AsyncClient(timeout=DEFAULT_TIMEOUT) as client:
            while url and len(playlists) < self.MAX_PLAYLISTS:
                response = await client.get(url, headers=headers)
                response.raise_for_status()
                data = response.json()
                playlists.extend(
                    self._map_playlist(item, my_id=me.id) for item in data.get("items", [])
                )
                url = data.get("next")

        return playlists

    async def get_playlist(self, access_token: str, playlist_id: str) -> SpotifyPlaylist:
        headers = {"Authorization": f"Bearer {access_token}"}
        url = f"{self.playlist_url}/{playlist_id}"
        async with httpx.AsyncClient(timeout=DEFAULT_TIMEOUT) as client:
            response = await client.get(url, headers=headers)
            response.raise_for_status()
            return self._map_playlist(response.json())

    async def list_tracks(self, access_token: str, playlist_id: str) -> list[SpotifyTrack]:
        headers = {"Authorization": f"Bearer {access_token}"}
        tracks: list[SpotifyTrack] = []
        url = f"{self.playlist_url}/{playlist_id}/items?limit={self.PAGE_SIZE}"

        async with httpx.AsyncClient(timeout=DEFAULT_TIMEOUT) as client:
            while url:
                response = await client.get(url, headers=headers)
                response.raise_for_status()
                data = response.json()
                for entry in data.get("items", []):
                    track = self._map_track(entry.get("item") or entry.get("track"))
                    if track is not None:
                        tracks.append(track)
                url = data.get("next")

        return tracks

    def _map_track(self, data: dict[str, Any] | None) -> SpotifyTrack | None:
        if not data or not isinstance(data, dict):
            return None
        artists = data.get("artists") or []
        artist = ", ".join(name for name in (item.get("name") for item in artists) if name)
        return SpotifyTrack(
            id=data.get("id"),
            name=data.get("name") or "Sin título",
            artist=artist or "Artista desconocido",
            duration_ms=data.get("duration_ms"),
        )

    def _map_playlist(self, data: dict[str, Any], my_id: str | None = None) -> SpotifyPlaylist:
        images = data.get("images") or []
        owner = data.get("owner") or {}
        items = data.get("items") or data.get("tracks") or {}
        owner_id = owner.get("id") or ""
        collaborative = bool(data.get("collaborative"))
        return SpotifyPlaylist(
            id=data["id"],
            name=data.get("name") or "Sin título",
            cover_url=images[0]["url"] if images else None,
            track_count=int(items.get("total") or 0),
            owner_name=owner.get("display_name") or owner_id or "Desconocido",
            owner_id=owner_id,
            collaborative=collaborative,
            migratable=(my_id is not None and owner_id == my_id) or collaborative,
            description=data.get("description"),
        )

    def _map_profile(self, data: dict[str, Any]) -> OAuthProfile:
        return OAuthProfile(
            id=data["id"],
            display_name=data.get("display_name") or data["id"],
            email=data.get("email"),
        )
