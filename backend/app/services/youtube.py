from typing import Any
from urllib.parse import urlencode

import httpx

from ..config import get_settings
from .base import DEFAULT_TIMEOUT, BaseOAuthService, OAuthProfile, OAuthToken


class YoutubeMusicOAuthService(BaseOAuthService):
    """Google OAuth 2.0 flow for YouTube Music access."""

    platform = "youtube-music"
    auth_url = "https://accounts.google.com/o/oauth2/v2/auth"
    token_url = "https://oauth2.googleapis.com/token"
    userinfo_url = "https://www.googleapis.com/oauth2/v2/userinfo"
    data_api_url = "https://www.googleapis.com/youtube/v3"

    def __init__(self) -> None:
        settings = get_settings()
        self._client_id = settings.youtube_client_id
        self._client_secret = settings.youtube_client_secret
        self._scopes = settings.youtube_scopes.split()

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
        return f"{get_settings().redirect_uri_base}/youtube-music/callback"

    def authorization_url(
        self,
        state: str,
        access_type: str = "offline",
        prompt: str = "consent",
    ) -> str:
        params = {
            "client_id": self.client_id,
            "response_type": "code",
            "redirect_uri": self.redirect_uri,
            "scope": " ".join(self.scopes),
            "state": state,
            "access_type": access_type,
            "prompt": prompt,
        }
        return f"{self.auth_url}?{urlencode(params)}"

    async def exchange_code(self, code: str) -> OAuthToken:
        return await super().exchange_code(code)

    async def create_playlist(
        self,
        access_token: str,
        title: str,
        description: str | None = None,
        privacy_status: str = "private",
    ) -> str:
        headers = {"Authorization": f"Bearer {access_token}"}
        url = f"{self.data_api_url}/playlists"
        params = {"part": "snippet,status"}
        payload = {
            "snippet": {"title": title, "description": description or ""},
            "status": {"privacyStatus": privacy_status},
        }
        async with httpx.AsyncClient(timeout=DEFAULT_TIMEOUT) as client:
            response = await client.post(url, params=params, json=payload, headers=headers)
            response.raise_for_status()
            data = response.json()
        return data["id"]

    async def search_video(self, access_token: str, query: str) -> str | None:
        headers = {"Authorization": f"Bearer {access_token}"}
        url = f"{self.data_api_url}/search"
        params = {
            "part": "snippet",
            "type": "video",
            "q": query,
            "maxResults": 1,
        }
        async with httpx.AsyncClient(timeout=DEFAULT_TIMEOUT) as client:
            response = await client.get(url, params=params, headers=headers)
            response.raise_for_status()
            items = response.json().get("items", [])
        for item in items:
            video_id = item.get("id", {}).get("videoId")
            if video_id:
                return video_id
        return None

    async def add_playlist_item(
        self,
        access_token: str,
        playlist_id: str,
        video_id: str,
        position: int = 0,
    ) -> None:
        headers = {"Authorization": f"Bearer {access_token}"}
        url = f"{self.data_api_url}/playlistItems"
        params = {"part": "snippet"}
        payload = {
            "snippet": {
                "playlistId": playlist_id,
                "position": position,
                "resourceId": {"kind": "youtube#video", "videoId": video_id},
            }
        }
        async with httpx.AsyncClient(timeout=DEFAULT_TIMEOUT) as client:
            response = await client.post(url, params=params, json=payload, headers=headers)
            response.raise_for_status()

    def _map_profile(self, data: dict[str, Any]) -> OAuthProfile:
        return OAuthProfile(
            id=data["id"],
            display_name=data.get("name") or data["id"],
            email=data.get("email"),
        )
