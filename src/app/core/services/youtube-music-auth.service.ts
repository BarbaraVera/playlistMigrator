import { Injectable } from '@angular/core';

import { BasePlatformAuthService } from './base-platform-auth.service';

@Injectable({ providedIn: 'root' })
export class YoutubeMusicAuthService extends BasePlatformAuthService {
  readonly platform = 'youtube-music' as const;
}
