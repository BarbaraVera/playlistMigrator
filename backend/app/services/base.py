from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any
from urllib.parse import urlencode

import httpx

DEFAULT_TIMEOUT = 15.0


@dataclass(frozen=True)
class OAuthToken:
    access_token: str
    refresh_token: str | None = None
    token_type: str = "Bearer"
    expires_in: int | None = None
    scope: str | None = None

    @classmethod
    def from_response(cls, data: dict[str, Any]) -> "OAuthToken":
        return cls(
            access_token=data["access_token"],
            refresh_token=data.get("refresh_token"),
            token_type=data.get("token_type", "Bearer"),
            expires_in=data.get("expires_in"),
            scope=data.get("scope"),
        )


@dataclass(frozen=True)
class OAuthProfile:
    id: str
    display_name: str
    email: str | None = None


class BaseOAuthService(ABC):
    """Common OAuth 2.0 Authorization Code flow used by Spotify and Google."""

    platform: str = ""
    auth_url: str = ""
    token_url: str = ""
    userinfo_url: str = ""

    @property
    @abstractmethod
    def client_id(self) -> str:
        ...

    @property
    @abstractmethod
    def client_secret(self) -> str:
        ...

    @property
    @abstractmethod
    def scopes(self) -> list[str]:
        ...

    @property
    @abstractmethod
    def redirect_uri(self) -> str:
        ...

    def authorization_url(self, state: str, **extra: Any) -> str:
        params: dict[str, Any] = {
            "client_id": self.client_id,
            "response_type": "code",
            "redirect_uri": self.redirect_uri,
            "scope": " ".join(self.scopes),
            "state": state,
            **extra,
        }
        return f"{self.auth_url}?{urlencode(params)}"

    async def exchange_code(self, code: str) -> OAuthToken:
        payload = {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": self.redirect_uri,
            "client_id": self.client_id,
            "client_secret": self.client_secret,
        }
        async with httpx.AsyncClient(timeout=DEFAULT_TIMEOUT) as client:
            response = await client.post(self.token_url, data=payload)
            response.raise_for_status()
            return OAuthToken.from_response(response.json())

    async def refresh_token(self, refresh_token: str) -> OAuthToken:
        payload = {
            "grant_type": "refresh_token",
            "refresh_token": refresh_token,
            "client_id": self.client_id,
            "client_secret": self.client_secret,
        }
        async with httpx.AsyncClient(timeout=DEFAULT_TIMEOUT) as client:
            response = await client.post(self.token_url, data=payload)
            response.raise_for_status()
            return OAuthToken.from_response(response.json())

    async def get_profile(self, access_token: str) -> OAuthProfile:
        headers = {"Authorization": f"Bearer {access_token}"}
        async with httpx.AsyncClient(timeout=DEFAULT_TIMEOUT) as client:
            response = await client.get(self.userinfo_url, headers=headers)
            response.raise_for_status()
            return self._map_profile(response.json())

    @abstractmethod
    def _map_profile(self, data: dict[str, Any]) -> OAuthProfile:
        ...
