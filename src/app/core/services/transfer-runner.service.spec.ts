import { HttpErrorResponse } from '@angular/common/http';
import { fakeAsync, flush, TestBed, tick } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';

import { PLAYLIST_FIXTURE } from './playlist-selection.fixture';
import { PlaylistSelectionService } from './playlist-selection.service';
import { SpotifyPlaylistService } from './spotify-playlist.service';
import { TransferResponse } from '../models/transfer';
import { TransferRunnerService, PROGRESS_POLL_INTERVAL_MS } from './transfer-runner.service';
import { TransferService } from './transfer.service';

const RESPONSE: TransferResponse = {
  playlists_migrated: 1,
  total_tracks: 42,
  successful_tracks: 36,
  failed_tracks: 6,
  results: [
    {
      playlist_id: 'pl-rock-clasico',
      title: 'Rock Clásico',
      youtube_playlist_id: 'yt-1',
      youtube_url: 'https://music.youtube.com/playlist?list=yt-1',
      total_tracks: 42,
      successful_tracks: 36,
      failed_tracks: 6,
    },
  ],
};

function loadAndSelect(selection: PlaylistSelectionService, ids: readonly string[]): void {
  selection.load();
  tick(900);
  for (const id of ids) {
    selection.toggle(id);
  }
}

describe('TransferRunnerService', () => {
  let transferService: jasmine.SpyObj<TransferService>;

  beforeEach(() => {
    TestBed.resetTestingModule();
    transferService = jasmine.createSpyObj('TransferService', ['migrate', 'fetchProgress']);
    transferService.fetchProgress.and.returnValue(of([]));
    TestBed.configureTestingModule({
      providers: [
        {
          provide: SpotifyPlaylistService,
          useValue: { list: () => Promise.resolve(PLAYLIST_FIXTURE) },
        },
        { provide: TransferService, useValue: transferService },
      ],
    });
  });

  it('no arranca sin playlists seleccionadas', fakeAsync(() => {
    const selection = TestBed.inject(PlaylistSelectionService);
    const runner = TestBed.inject(TransferRunnerService);
    loadAndSelect(selection, []);

    runner.start();
    tick();

    expect(runner.status()).toBe('idle');
    expect(transferService.migrate).not.toHaveBeenCalled();
    expect(runner.playlistRuns().length).toBe(0);
  }));

  it('llama al backend y completa con el resumen real', fakeAsync(() => {
    const selection = TestBed.inject(PlaylistSelectionService);
    const runner = TestBed.inject(TransferRunnerService);
    loadAndSelect(selection, ['pl-rock-clasico']);

    transferService.migrate.and.returnValue(of(RESPONSE));
    runner.start();

    expect(transferService.migrate).toHaveBeenCalledWith(['pl-rock-clasico']);
    expect(runner.status()).toBe('completed');
    expect(runner.percent()).toBe(100);
    expect(runner.totalTracks()).toBe(42);
    expect(runner.summary().totalPlaylists).toBe(1);
    expect(runner.summary().processedTracks).toBe(42);
    expect(runner.summary().successfulTracks).toBe(36);
    expect(runner.summary().failedTracks).toBe(6);

    const run = runner.playlistRuns()[0];
    expect(run.status).toBe('done');
    expect(run.successCount).toBe(36);
    expect(run.warningCount).toBe(6);
  }));

  it('aplica el resultado por playlist a cada run', fakeAsync(() => {
    const selection = TestBed.inject(PlaylistSelectionService);
    const runner = TestBed.inject(TransferRunnerService);
    loadAndSelect(selection, ['pl-rock-clasico', 'pl-chill-tarde']);

    const response: TransferResponse = {
      playlists_migrated: 2,
      total_tracks: 70,
      successful_tracks: 60,
      failed_tracks: 10,
      results: [
        {
          playlist_id: 'pl-rock-clasico',
          title: 'Rock Clásico',
          youtube_playlist_id: 'yt-1',
          youtube_url: 'https://music.youtube.com/playlist?list=yt-1',
          total_tracks: 42,
          successful_tracks: 36,
          failed_tracks: 6,
        },
        {
          playlist_id: 'pl-chill-tarde',
          title: 'Chill de Tarde',
          youtube_playlist_id: 'yt-2',
          youtube_url: 'https://music.youtube.com/playlist?list=yt-2',
          total_tracks: 28,
          successful_tracks: 24,
          failed_tracks: 4,
        },
      ],
    };
    transferService.migrate.and.returnValue(of(response));
    runner.start();
    tick();

    const runs = runner.playlistRuns();
    expect(runs.length).toBe(2);
    expect(runs.every((run) => run.status === 'done')).toBeTrue();
    expect(runs[0].processedTracks).toBe(42);
    expect(runs[1].processedTracks).toBe(28);
  }));

  it('marca failed cuando el backend devuelve error', fakeAsync(() => {
    const selection = TestBed.inject(PlaylistSelectionService);
    const runner = TestBed.inject(TransferRunnerService);
    loadAndSelect(selection, ['pl-rock-clasico']);

    transferService.migrate.and.returnValue(throwError(() => new Error('API caída')));
    runner.start();
    tick();

    expect(runner.status()).toBe('failed');
    expect(runner.errorMessage()).toBe('No se pudo conectar con el servidor.');
  }));

  it('expone el mensaje estructurado del backend en el error', fakeAsync(() => {
    const selection = TestBed.inject(PlaylistSelectionService);
    const runner = TestBed.inject(TransferRunnerService);
    loadAndSelect(selection, ['pl-rock-clasico']);

    transferService.migrate.and.returnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 502,
            statusText: 'Bad Gateway',
            error: {
              playlist_id: 'pl-rock-clasico',
              error: 'api_error',
              message: 'The request cannot be completed because you have exceeded your quota.',
              status_code: 403,
              status: 'PERMISSION_DENIED',
              method: 'POST',
              endpoint: '/youtube/v3/playlistItems',
            },
          }),
      ),
    );
    runner.start();
    tick();

    expect(runner.status()).toBe('failed');
    expect(runner.errorMessage()).toBe(
      'The request cannot be completed because you have exceeded your quota.',
    );
  }));

  it('cancela la petición en curso', fakeAsync(() => {
    const selection = TestBed.inject(PlaylistSelectionService);
    const runner = TestBed.inject(TransferRunnerService);
    loadAndSelect(selection, ['pl-rock-clasico']);

    const subject = new Subject<TransferResponse>();
    transferService.migrate.and.returnValue(subject.asObservable());
    runner.start();
    tick();
    expect(runner.status()).toBe('in_progress');

    runner.cancel();
    tick();

    expect(runner.status()).toBe('cancelled');

    subject.next(RESPONSE);
    subject.complete();
    tick();

    expect(runner.status()).toBe('cancelled');
  }));

  it('actualiza la barra con el progreso del backend durante la migración', fakeAsync(() => {
    const selection = TestBed.inject(PlaylistSelectionService);
    const runner = TestBed.inject(TransferRunnerService);
    loadAndSelect(selection, ['pl-rock-clasico']);

    const subject = new Subject<TransferResponse>();
    transferService.migrate.and.returnValue(subject.asObservable());
    transferService.fetchProgress.and.returnValues(
      of([{ playlist_id: 'pl-rock-clasico', total_tracks: 42, processed_tracks: 10 }]),
      of([{ playlist_id: 'pl-rock-clasico', total_tracks: 42, processed_tracks: 25 }]),
    );
    runner.start();
    tick();
    expect(runner.status()).toBe('in_progress');

    tick(PROGRESS_POLL_INTERVAL_MS);
    expect(runner.playlistRuns()[0].processedTracks).toBe(10);
    expect(runner.percent()).toBe(24);

    tick(PROGRESS_POLL_INTERVAL_MS);
    expect(runner.playlistRuns()[0].processedTracks).toBe(25);
    expect(runner.percent()).toBe(60);

    runner.cancel();
    tick();
    flush();
  }));

  it('reinicia el estado tras finalizar', fakeAsync(() => {
    const selection = TestBed.inject(PlaylistSelectionService);
    const runner = TestBed.inject(TransferRunnerService);
    loadAndSelect(selection, ['pl-rock-clasico']);

    transferService.migrate.and.returnValue(of(RESPONSE));
    runner.start();
    tick();
    expect(runner.status()).toBe('completed');

    runner.reset();

    expect(runner.status()).toBe('idle');
    expect(runner.playlistRuns().length).toBe(0);
    expect(runner.totalTracks()).toBe(0);
    expect(runner.percent()).toBe(0);
    expect(runner.summary().totalPlaylists).toBe(0);
  }));

  it('no cancela si no hay migración en curso', fakeAsync(() => {
    const selection = TestBed.inject(PlaylistSelectionService);
    const runner = TestBed.inject(TransferRunnerService);
    loadAndSelect(selection, ['pl-rock-clasico']);

    transferService.migrate.and.returnValue(of(RESPONSE));
    runner.start();
    tick();

    runner.cancel();

    expect(runner.status()).toBe('completed');

    flush();
  }));
});
