import { Injectable } from '@angular/core';
import { fakeAsync, flush, TestBed, tick } from '@angular/core/testing';

import { PlaylistSelectionService } from './playlist-selection.service';
import { TransferRunnerService } from './transfer-runner.service';

@Injectable()
class InstantRunner extends TransferRunnerService {
  protected override trackDelayMs(): number {
    return 0;
  }

  protected override playlistDelayMs(): number {
    return 0;
  }
}

@Injectable()
class ControlledRunner extends TransferRunnerService {
  protected override trackDelayMs(): number {
    return 100;
  }

  protected override playlistDelayMs(): number {
    return 100;
  }
}

function loadAndSelect(selection: PlaylistSelectionService, ids: readonly string[]): void {
  selection.load();
  tick(900);
  for (const id of ids) {
    selection.toggle(id);
  }
}

describe('TransferRunnerService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [InstantRunner, ControlledRunner],
    });
  });

  it('completa la migración con el resumen correcto', fakeAsync(() => {
    const selection = TestBed.inject(PlaylistSelectionService);
    const runner = TestBed.inject(InstantRunner);
    loadAndSelect(selection, ['pl-rock-clasico', 'pl-chill-tarde']);

    runner.start();
    flush(100000);

    expect(runner.status()).toBe('completed');
    expect(runner.percent()).toBe(100);
    expect(runner.summary().totalPlaylists).toBe(2);
    expect(runner.summary().processedTracks).toBe(70);
    expect(runner.summary().successfulTracks).toBe(60);
    expect(runner.summary().failedTracks).toBe(10);
    expect(runner.playlistRuns().every((run) => run.status === 'done')).toBeTrue();
    expect(runner.log().length).toBe(50);
    expect(runner.items().length).toBe(70);
    expect(runner.currentPlaylist()).toBeNull();
  }));

  it('no arranca sin playlists seleccionadas', fakeAsync(() => {
    const selection = TestBed.inject(PlaylistSelectionService);
    const runner = TestBed.inject(InstantRunner);
    loadAndSelect(selection, []);

    runner.start();
    tick();

    expect(runner.status()).toBe('idle');
    expect(runner.playlistRuns().length).toBe(0);
    expect(runner.percent()).toBe(0);
  }));

  it('pausa y reanuda la ejecución', fakeAsync(() => {
    const selection = TestBed.inject(PlaylistSelectionService);
    const runner = TestBed.inject(ControlledRunner);
    loadAndSelect(selection, ['pl-rock-clasico']);

    runner.start();
    tick(300);
    expect(runner.processedTracks()).toBeGreaterThan(0);

    runner.pause();
    expect(runner.paused()).toBeTrue();
    tick(1000);
    const pausedCount = runner.processedTracks();
    tick(1000);
    expect(runner.processedTracks()).toBe(pausedCount);
    expect(runner.status()).toBe('in_progress');

    runner.resume();
    expect(runner.paused()).toBeFalse();
    tick(6000);

    expect(runner.status()).toBe('completed');
  }));

  it('cancela a mitad de la transferencia', fakeAsync(() => {
    const selection = TestBed.inject(PlaylistSelectionService);
    const runner = TestBed.inject(ControlledRunner);
    loadAndSelect(selection, ['pl-roadtrip-2026']);

    runner.start();
    tick(500);
    expect(runner.status()).toBe('in_progress');

    runner.cancel();
    tick(1000);

    expect(runner.status()).toBe('cancelled');
    expect(runner.percent()).toBeLessThan(100);
    expect(runner.currentPlaylist()).toBeNull();
    expect(runner.playlistRuns().every((run) => run.status !== 'done')).toBeTrue();
  }));

  it('reinicia el estado tras finalizar', fakeAsync(() => {
    const selection = TestBed.inject(PlaylistSelectionService);
    const runner = TestBed.inject(InstantRunner);
    loadAndSelect(selection, ['pl-gym-power']);

    runner.start();
    flush(100000);
    expect(runner.status()).toBe('completed');

    runner.reset();

    expect(runner.status()).toBe('idle');
    expect(runner.playlistRuns().length).toBe(0);
    expect(runner.items().length).toBe(0);
    expect(runner.log().length).toBe(0);
    expect(runner.percent()).toBe(0);
    expect(runner.summary().totalPlaylists).toBe(0);
    expect(runner.paused()).toBeFalse();
  }));
});
