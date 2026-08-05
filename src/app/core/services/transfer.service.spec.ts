import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { credentialsInterceptor } from '../http/credentials.interceptor';
import { TransferResponse } from '../models/transfer';
import { TransferService } from './transfer.service';

describe('TransferService', () => {
  let service: TransferService;
  let http: HttpTestingController;

  const RESPONSE: TransferResponse = {
    playlists_migrated: 2,
    total_tracks: 70,
    successful_tracks: 60,
    failed_tracks: 10,
    results: [
      {
        playlist_id: 'pl-1',
        title: 'Rock Clásico',
        youtube_playlist_id: 'yt-1',
        youtube_url: 'https://music.youtube.com/playlist?list=yt-1',
        total_tracks: 42,
        successful_tracks: 36,
        failed_tracks: 6,
      },
      {
        playlist_id: 'pl-2',
        title: 'Chill de Tarde',
        youtube_playlist_id: 'yt-2',
        youtube_url: 'https://music.youtube.com/playlist?list=yt-2',
        total_tracks: 28,
        successful_tracks: 24,
        failed_tracks: 4,
      },
    ],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([credentialsInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(TransferService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('POSTea /api/transfer con los ids seleccionados y credenciales', async () => {
    const resultPromise = firstValueFrom(service.migrate(['pl-1', 'pl-2']));

    const request = http.expectOne(`${service.baseUrl}/api/transfer`);
    expect(request.request.method).toBe('POST');
    expect(request.request.withCredentials).toBe(true);
    expect(request.request.body).toEqual({ playlist_ids: ['pl-1', 'pl-2'] });
    request.flush(RESPONSE);

    await expectAsync(resultPromise).toBeResolvedTo(RESPONSE);
  });

  it('no muta la lista de ids recibida', async () => {
    const ids = ['pl-1', 'pl-2'];
    const resultPromise = firstValueFrom(service.migrate(ids));

    const request = http.expectOne(`${service.baseUrl}/api/transfer`);
    expect(request.request.body).toEqual({ playlist_ids: ['pl-1', 'pl-2'] });
    request.flush(RESPONSE);
    await resultPromise;

    expect(ids).toEqual(['pl-1', 'pl-2']);
  });

  it('propaga los errores del backend', async () => {
    const resultPromise = firstValueFrom(service.migrate(['pl-1']));

    http
      .expectOne(`${service.baseUrl}/api/transfer`)
      .flush({ detail: 'spotify not connected' }, { status: 401, statusText: 'Unauthorized' });

    await expectAsync(resultPromise).toBeRejected();
  });

  it('GETea /api/transfer/progress con credenciales', async () => {
    const progress = [
      { playlist_id: 'pl-1', total_tracks: 42, processed_tracks: 10 },
      { playlist_id: 'pl-2', total_tracks: 28, processed_tracks: 28 },
    ];
    const resultPromise = firstValueFrom(service.fetchProgress());

    const request = http.expectOne(`${service.baseUrl}/api/transfer/progress`);
    expect(request.request.method).toBe('GET');
    expect(request.request.withCredentials).toBe(true);
    request.flush(progress);

    await expectAsync(resultPromise).toBeResolvedTo(progress);
  });
});
