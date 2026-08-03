import { fakeAsync, TestBed, tick } from '@angular/core/testing';

import { Playlist } from '../models/playlist';
import { SpotifyPlaylistService } from './spotify-playlist.service';

describe('SpotifyPlaylistService', () => {
  let service: SpotifyPlaylistService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SpotifyPlaylistService);
  });

  it('lista playlists mock tipadas de Spotify', fakeAsync(async () => {
    let result: readonly Playlist[] = [];
    void service.list().then((playlists) => {
      result = playlists;
    });

    tick(2000);

    expect(result.length).toBeGreaterThan(0);
    expect(result.every((playlist) => playlist.platform === 'spotify')).toBe(true);
    expect(result.every((playlist) => playlist.id.length > 0)).toBe(true);
    expect(result.every((playlist) => playlist.title.length > 0)).toBe(true);
    expect(result.every((playlist) => playlist.trackCount > 0)).toBe(true);
    expect(
      result.every((playlist) => playlist.coverUrl.startsWith('data:image/svg+xml')),
    ).toBe(true);
  }));
});
