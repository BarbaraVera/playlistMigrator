import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { getBackendBaseUrl } from '../http/backend-url';
import { Playlist, Track } from '../models/playlist';

interface SpotifyPlaylistDto {
  id: string;
  name: string;
  cover_url: string | null;
  track_count: number;
  owner: string;
  migratable: boolean;
  description: string | null;
}

interface SpotifyTrackDto {
  id: string | null;
  name: string;
  artist: string;
  duration_ms: number | null;
}

function coverSvg(from: string, to: string, emoji: string): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/>` +
    `</linearGradient></defs>` +
    `<rect width="160" height="160" fill="url(#g)"/>` +
    `<text x="80" y="98" font-size="60" text-anchor="middle" dominant-baseline="middle">${emoji}</text>` +
    `</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

@Injectable({ providedIn: 'root' })
export class SpotifyPlaylistService {
  private readonly http = inject(HttpClient);
  readonly baseUrl = getBackendBaseUrl();

  async list(): Promise<readonly Playlist[]> {
    const items = await firstValueFrom(
      this.http.get<SpotifyPlaylistDto[]>(`${this.baseUrl}/api/spotify/playlists`, {
        withCredentials: true,
      }),
    );
    return items.map((item) => this.toPlaylist(item));
  }

  private toPlaylist(item: SpotifyPlaylistDto): Playlist {
    return {
      id: item.id,
      title: item.name,
      coverUrl: item.cover_url ?? coverSvg('#4361ee', '#4cc9f0', '🎵'),
      trackCount: item.track_count,
      owner: item.owner,
      migratable: item.migratable,
      platform: 'spotify',
      description: item.description ?? undefined,
    };
  }

  async listTracks(playlistId: string): Promise<readonly Track[]> {
    const items = await firstValueFrom(
      this.http.get<SpotifyTrackDto[]>(`${this.baseUrl}/api/spotify/playlists/${playlistId}/tracks`, {
        withCredentials: true,
      }),
    );
    return items.map((item) => ({
      id: item.id ?? '',
      title: item.name,
      artist: item.artist,
      durationMs: item.duration_ms ?? undefined,
    }));
  }
}
