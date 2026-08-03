import { Injectable } from '@angular/core';

import { PlatformProfile } from '../models/platform';
import { BasePlatformAuthService } from './base-platform-auth.service';

@Injectable({ providedIn: 'root' })
export class SpotifyAuthService extends BasePlatformAuthService {
  readonly platform = 'spotify' as const;
  protected readonly delayMs = 1400;

  protected authenticate(): Promise<PlatformProfile> {
    return Promise.resolve({
      id: 'mock-spotify-001',
      displayName: 'Camaleón Musical',
      email: 'demo@spotify.mock',
    });
  }
}
