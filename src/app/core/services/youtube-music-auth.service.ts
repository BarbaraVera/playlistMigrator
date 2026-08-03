import { Injectable } from '@angular/core';

import { PlatformProfile } from '../models/platform';
import { BasePlatformAuthService } from './base-platform-auth.service';

@Injectable({ providedIn: 'root' })
export class YoutubeMusicAuthService extends BasePlatformAuthService {
  readonly platform = 'youtube-music' as const;
  protected readonly delayMs = 1800;

  protected authenticate(): Promise<PlatformProfile> {
    return Promise.resolve({
      id: 'mock-ytm-001',
      displayName: 'Melómano Playlists',
      email: 'demo@youtube.mock',
    });
  }
}
