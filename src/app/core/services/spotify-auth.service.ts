import { Injectable } from '@angular/core';

import { BasePlatformAuthService } from './base-platform-auth.service';

@Injectable({ providedIn: 'root' })
export class SpotifyAuthService extends BasePlatformAuthService {
  readonly platform = 'spotify' as const;
}
