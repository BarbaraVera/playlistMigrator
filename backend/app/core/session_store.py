import secrets
import time
from dataclasses import dataclass, field
from threading import Lock
from typing import Any

DEFAULT_SESSION_TTL_SECONDS = 7 * 24 * 3600


@dataclass
class Session:
    platform_tokens: dict[str, Any] = field(default_factory=dict)
    expires_at: float = 0.0

    def set_platform_token(self, platform: str, token: Any) -> None:
        self.platform_tokens[platform] = token

    def remove_platform_token(self, platform: str) -> None:
        self.platform_tokens.pop(platform, None)

    def connected_platforms(self) -> list[str]:
        return sorted(self.platform_tokens)


class SessionStore:
    """In-memory store for OAuth tokens keyed by a random session id.

    Intended for local development only; the id is stored in an HTTP-only
    cookie on the browser. Swap for a persistent backend (e.g. Redis or a
    signed JWT cookie) when deploying with multiple workers.
    """

    def __init__(self, ttl_seconds: int = DEFAULT_SESSION_TTL_SECONDS) -> None:
        self._ttl_seconds = ttl_seconds
        self._sessions: dict[str, Session] = {}
        self._lock = Lock()

    def create(self) -> str:
        session_id = secrets.token_urlsafe(32)
        now = time.monotonic()
        with self._lock:
            self._prune(now)
            self._sessions[session_id] = Session(expires_at=now + self._ttl_seconds)
        return session_id

    def get(self, session_id: str) -> Session | None:
        now = time.monotonic()
        with self._lock:
            session = self._sessions.get(session_id)
            if session is None or session.expires_at < now:
                return None
            return session

    def remove(self, session_id: str) -> None:
        with self._lock:
            self._sessions.pop(session_id, None)

    def _prune(self, now: float) -> None:
        expired = [key for key, session in self._sessions.items() if session.expires_at < now]
        for key in expired:
            del self._sessions[key]


session_store = SessionStore()
