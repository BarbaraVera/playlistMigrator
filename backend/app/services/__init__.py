from .base import BaseOAuthService, OAuthProfile, OAuthToken
from .spotify import SpotifyOAuthService, SpotifyPlaylist, SpotifyTrack
from .youtube import YoutubeMusicOAuthService

spotify_oauth = SpotifyOAuthService()
youtube_oauth = YoutubeMusicOAuthService()

OAUTH_SERVICES: dict[str, BaseOAuthService] = {
    SpotifyOAuthService.platform: spotify_oauth,
    YoutubeMusicOAuthService.platform: youtube_oauth,
}

__all__ = [
    "BaseOAuthService",
    "OAuthProfile",
    "OAuthToken",
    "SpotifyOAuthService",
    "SpotifyPlaylist",
    "SpotifyTrack",
    "YoutubeMusicOAuthService",
    "OAUTH_SERVICES",
    "spotify_oauth",
    "youtube_oauth",
]
