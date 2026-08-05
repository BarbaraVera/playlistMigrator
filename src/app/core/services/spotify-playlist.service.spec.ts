import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { credentialsInterceptor } from '../http/credentials.interceptor';
import { SpotifyPlaylistService } from './spotify-playlist.service';

describe('SpotifyPlaylistService', () => {
  let service: SpotifyPlaylistService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([credentialsInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(SpotifyPlaylistService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('consulta /api/spotify/playlists con credenciales y mapea la respuesta', async () => {
    const promise = service.list();

    const request = http.expectOne(`${service.baseUrl}/api/spotify/playlists`);
    expect(request.request.method).toBe('GET');
    expect(request.request.withCredentials).toBe(true);
    request.flush([
      {
        id: 'pl-1',
        name: 'Rock Clásico',
        cover_url: 'https://img/rock.jpg',
        track_count: 42,
        owner: 'Camaleón Musical',
        migratable: true,
        description: 'Los himnos del rock.',
      },
      {
        id: 'pl-2',
        name: 'Gym Power',
        cover_url: null,
        track_count: 35,
        owner: 'Camaleón Musical',
        migratable: false,
        description: null,
      },
    ]);

    const playlists = await promise;
    expect(playlists.length).toBe(2);

    const rock = playlists[0];
    expect(rock.id).toBe('pl-1');
    expect(rock.title).toBe('Rock Clásico');
    expect(rock.coverUrl).toBe('https://img/rock.jpg');
    expect(rock.trackCount).toBe(42);
    expect(rock.owner).toBe('Camaleón Musical');
    expect(rock.migratable).toBe(true);
    expect(rock.platform).toBe('spotify');
    expect(rock.description).toBe('Los himnos del rock.');

    const gym = playlists[1];
    expect(gym.coverUrl.startsWith('data:image/svg+xml')).toBe(true);
    expect(gym.migratable).toBe(false);
    expect(gym.description).toBeUndefined();
  });

  it('propaga los errores del backend', async () => {
    const promise = service.list();

    http
      .expectOne(`${service.baseUrl}/api/spotify/playlists`)
      .flush({ detail: 'spotify not connected' }, { status: 401, statusText: 'Unauthorized' });

    await expectAsync(promise).toBeRejected();
  });

  it('consulta los temas de una playlist y mapea la respuesta', async () => {
    const promise = service.listTracks('pl-1');

    const request = http.expectOne(`${service.baseUrl}/api/spotify/playlists/pl-1/tracks`);
    expect(request.request.method).toBe('GET');
    expect(request.request.withCredentials).toBe(true);
    request.flush([
      { id: 'track-1', name: 'Bohemian Rhapsody', artist: 'Queen', duration_ms: 354000 },
      { id: null, name: 'Sinfonía', artist: 'Orquesta', duration_ms: null },
    ]);

    const tracks = await promise;
    expect(tracks.length).toBe(2);
    expect(tracks[0]).toEqual({
      id: 'track-1',
      title: 'Bohemian Rhapsody',
      artist: 'Queen',
      durationMs: 354000,
    });
    expect(tracks[1].id).toBe('');
    expect(tracks[1].durationMs).toBeUndefined();
  });
});
