import os
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

DEFAULT_SPOTIFY_SCOPES = "playlist-read-private playlist-read-collaborative"
DEFAULT_YOUTUBE_SCOPES = (
    "https://www.googleapis.com/auth/youtube "
    "https://www.googleapis.com/auth/youtube.force-ssl"
)


class Settings:
    app_name: str = "playlist-migrator-api"

    cors_origins: list[str] = [
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS", "http://localhost:4200,http://127.0.0.1:4200"
        ).split(",")
    ]

    frontend_base_url: str = os.getenv("FRONTEND_BASE_URL", "http://127.0.0.1:4200")

    session_ttl_seconds: int = int(
        os.getenv("SESSION_TTL_SECONDS", str(7 * 24 * 3600))
    )

    redirect_uri_base: str = os.getenv(
        "REDIRECT_URI_BASE", "http://localhost:8000/api/auth"
    )

    spotify_client_id: str = os.getenv("SPOTIFY_CLIENT_ID", "")
    spotify_client_secret: str = os.getenv("SPOTIFY_CLIENT_SECRET", "")
    spotify_scopes: str = os.getenv("SPOTIFY_SCOPES", DEFAULT_SPOTIFY_SCOPES)

    youtube_client_id: str = os.getenv("YOUTUBE_CLIENT_ID", "")
    youtube_client_secret: str = os.getenv("YOUTUBE_CLIENT_SECRET", "")
    youtube_scopes: str = os.getenv("YOUTUBE_SCOPES", DEFAULT_YOUTUBE_SCOPES)


@lru_cache
def get_settings() -> Settings:
    return Settings()
