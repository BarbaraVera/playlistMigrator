import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { getBackendBaseUrl } from '../http/backend-url';
import { PlatformId } from '../models/platform';

const PLATFORM_BACKEND_IDS: Record<PlatformId, string> = {
  spotify: 'spotify',
  'youtube-music': 'youtube',
};

const BACKEND_PLATFORM_IDS: Record<string, PlatformId> = {
  spotify: 'spotify',
  youtube: 'youtube-music',
};

interface AuthStatusResponse {
  connected_platforms: string[];
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly backendBaseUrl = getBackendBaseUrl();

  private readonly http = inject(HttpClient);

  checkStatus(): Observable<PlatformId[]> {
    return this.http
      .get<AuthStatusResponse>(`${this.backendBaseUrl}/api/auth/me`, {
        withCredentials: true,
      })
      .pipe(map((response) => this.toPlatformIds(response.connected_platforms)));
  }

  login(platform: PlatformId): void {
    this.navigateTo(this.buildLoginUrl(platform));
  }

  disconnectPlatform(platform: PlatformId): Observable<void> {
    return this.http.post<void>(
      `${this.backendBaseUrl}/api/auth/${PLATFORM_BACKEND_IDS[platform]}/disconnect`,
      null,
      { withCredentials: true },
    );
  }

  buildLoginUrl(platform: PlatformId): string {
    return `${this.backendBaseUrl}/api/auth/${PLATFORM_BACKEND_IDS[platform]}/login`;
  }

  protected navigateTo(url: string): void {
    window.location.assign(url);
  }

  private toPlatformIds(backendPlatforms: string[]): PlatformId[] {
    return backendPlatforms
      .map((platform) => BACKEND_PLATFORM_IDS[platform])
      .filter((platform): platform is PlatformId => platform !== undefined);
  }
}
