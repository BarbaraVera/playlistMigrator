import { InjectionToken, Provider } from '@angular/core';

import { PlatformAuthService } from './platform-auth.service';
import { SpotifyAuthService } from './spotify-auth.service';
import { YoutubeMusicAuthService } from './youtube-music-auth.service';

export const PLATFORM_AUTH_SERVICES = new InjectionToken<readonly PlatformAuthService[]>(
  'PLATFORM_AUTH_SERVICES',
);

export function providePlatformAuthServices(): Provider {
  return {
    provide: PLATFORM_AUTH_SERVICES,
    useFactory: (spotify: SpotifyAuthService, youtube: YoutubeMusicAuthService) => [
      spotify,
      youtube,
    ],
    deps: [SpotifyAuthService, YoutubeMusicAuthService],
  };
}
