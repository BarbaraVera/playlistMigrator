import secrets
import time
from dataclasses import dataclass
from threading import Lock


@dataclass(frozen=True)
class StateEntry:
    platform: str
    expires_at: float


class StateStore:
    """In-memory store for OAuth `state` tokens to prevent CSRF.

    Not shared between processes; swap for a persistent backend (e.g. Redis)
    when deploying with multiple workers.
    """

    def __init__(self, ttl_seconds: int = 600) -> None:
        self._ttl_seconds = ttl_seconds
        self._entries: dict[str, StateEntry] = {}
        self._lock = Lock()

    def create(self, platform: str) -> str:
        state = secrets.token_urlsafe(32)
        now = time.monotonic()
        with self._lock:
            self._prune(now)
            self._entries[state] = StateEntry(
                platform=platform, expires_at=now + self._ttl_seconds
            )
        return state

    def consume(self, state: str, platform: str) -> bool:
        now = time.monotonic()
        with self._lock:
            entry = self._entries.pop(state, None)
            if entry is None or entry.platform != platform or entry.expires_at < now:
                return False
        return True

    def _prune(self, now: float) -> None:
        expired = [key for key, entry in self._entries.items() if entry.expires_at < now]
        for key in expired:
            del self._entries[key]


state_store = StateStore()
