import { computed, inject, Injectable, signal } from '@angular/core';

import { PlaylistSelectionService } from './playlist-selection.service';
import {
  ItemTransferProgress,
  ItemTransferResult,
  PlaylistRun,
  TransferLogEntry,
  TransferStatus,
  TransferSummary,
} from '../models/transfer';

const MAX_LOG_ENTRIES = 50;
const TRACK_DELAY_MS = 60;
const PLAYLIST_DELAY_MS = 250;

@Injectable({ providedIn: 'root' })
export class TransferRunnerService {
  private readonly selection = inject(PlaylistSelectionService);

  private readonly statusSignal = signal<TransferStatus>('idle');
  private readonly playlistRunsSignal = signal<readonly PlaylistRun[]>([]);
  private readonly itemsSignal = signal<readonly ItemTransferProgress[]>([]);
  private readonly logSignal = signal<readonly TransferLogEntry[]>([]);
  private readonly currentPlaylistIdSignal = signal<string | null>(null);
  private readonly startedAtSignal = signal<number | null>(null);
  private readonly finishedAtSignal = signal<number | null>(null);
  private readonly pausedSignal = signal(false);

  private abort = false;
  private isPaused = false;
  private resumeWaiters: (() => void)[] = [];

  readonly status = this.statusSignal.asReadonly();
  readonly playlistRuns = this.playlistRunsSignal.asReadonly();
  readonly items = this.itemsSignal.asReadonly();
  readonly log = this.logSignal.asReadonly();
  readonly currentPlaylistId = this.currentPlaylistIdSignal.asReadonly();
  readonly paused = this.pausedSignal.asReadonly();

  readonly totalTracks = computed(() => {
    return this.playlistRunsSignal().reduce((sum, run) => sum + run.totalTracks, 0);
  });

  readonly processedTracks = computed(() => {
    return this.playlistRunsSignal().reduce((sum, run) => sum + run.processedTracks, 0);
  });

  readonly percent = computed(() => {
    const total = this.totalTracks();
    return total > 0 ? Math.round((this.processedTracks() / total) * 100) : 0;
  });

  readonly elapsedMs = computed(() => {
    const startedAt = this.startedAtSignal();
    if (startedAt === null) {
      return 0;
    }
    const end = this.finishedAtSignal() ?? Date.now();
    return Math.max(0, end - startedAt);
  });

  readonly summary = computed<TransferSummary>(() => {
    const runs = this.playlistRunsSignal();
    const processedTracks = runs.reduce((sum, run) => sum + run.processedTracks, 0);
    const successfulTracks = runs.reduce((sum, run) => sum + run.successCount, 0);
    return {
      totalPlaylists: runs.length,
      processedTracks,
      successfulTracks,
      failedTracks: processedTracks - successfulTracks,
      elapsedMs: this.elapsedMs(),
    };
  });

  readonly currentPlaylist = computed(() => {
    const id = this.currentPlaylistIdSignal();
    return this.playlistRunsSignal().find((run) => run.playlistId === id) ?? null;
  });

  start(): void {
    if (this.statusSignal() !== 'idle') {
      return;
    }

    const selected = this.selection.selectedPlaylists();
    if (selected.length === 0) {
      return;
    }

    const runs: PlaylistRun[] = selected.map((playlist) => ({
      playlistId: playlist.id,
      title: playlist.title,
      coverUrl: playlist.coverUrl,
      totalTracks: playlist.trackCount,
      processedTracks: 0,
      successCount: 0,
      warningCount: 0,
      status: 'pending',
    }));

    this.abort = false;
    this.isPaused = false;
    this.pausedSignal.set(false);
    this.resumeWaiters = [];
    this.statusSignal.set('in_progress');
    this.playlistRunsSignal.set(runs);
    this.itemsSignal.set([]);
    this.logSignal.set([]);
    this.currentPlaylistIdSignal.set(null);
    this.startedAtSignal.set(Date.now());
    this.finishedAtSignal.set(null);

    void this.run(runs);
  }

  pause(): void {
    this.isPaused = true;
    this.pausedSignal.set(true);
  }

  resume(): void {
    if (!this.isPaused) {
      return;
    }
    this.isPaused = false;
    this.pausedSignal.set(false);
    const waiters = this.resumeWaiters;
    this.resumeWaiters = [];
    for (const resolve of waiters) {
      resolve();
    }
  }

  cancel(): void {
    if (this.statusSignal() !== 'in_progress') {
      return;
    }
    this.abort = true;
    this.isPaused = false;
    this.pausedSignal.set(false);
    const waiters = this.resumeWaiters;
    this.resumeWaiters = [];
    for (const resolve of waiters) {
      resolve();
    }
  }

  reset(): void {
    this.abort = false;
    this.isPaused = false;
    this.pausedSignal.set(false);
    this.resumeWaiters = [];
    this.statusSignal.set('idle');
    this.playlistRunsSignal.set([]);
    this.itemsSignal.set([]);
    this.logSignal.set([]);
    this.currentPlaylistIdSignal.set(null);
    this.startedAtSignal.set(null);
    this.finishedAtSignal.set(null);
  }

  protected trackDelayMs(): number {
    return TRACK_DELAY_MS;
  }

  protected playlistDelayMs(): number {
    return PLAYLIST_DELAY_MS;
  }

  protected resultFor(index: number): ItemTransferResult {
    if (index % 13 === 0) {
      return 'not_found';
    }
    if (index % 17 === 0) {
      return 'skipped';
    }
    return 'success';
  }

  protected trackTitleFor(run: PlaylistRun, index: number): string {
    return `Tema ${index + 1} de ${run.title}`;
  }

  private async run(runs: readonly PlaylistRun[]): Promise<void> {
    for (const run of runs) {
      if (this.abort) {
        this.finish('cancelled');
        return;
      }

      this.currentPlaylistIdSignal.set(run.playlistId);
      this.updateRun(run.playlistId, { status: 'running' });

      for (let index = 0; index < run.totalTracks; index++) {
        if (this.abort) {
          this.finish('cancelled');
          return;
        }
        await this.waitWhilePaused();
        if (this.abort) {
          this.finish('cancelled');
          return;
        }
        await delay(this.trackDelayMs());
        if (this.abort) {
          this.finish('cancelled');
          return;
        }

        const result = this.resultFor(index);
        const trackId = `${run.playlistId}::track-${index + 1}`;
        this.recordItem(run, trackId, index, result);
      }

      await delay(this.playlistDelayMs());
      if (this.abort) {
        this.finish('cancelled');
        return;
      }
      this.updateRun(run.playlistId, { status: 'done' });
    }

    this.finish('completed');
  }

  private finish(status: TransferStatus): void {
    this.finishedAtSignal.set(Date.now());
    this.currentPlaylistIdSignal.set(null);
    this.statusSignal.set(status);
  }

  private recordItem(
    run: PlaylistRun,
    trackId: string,
    index: number,
    result: ItemTransferResult,
  ): void {
    const trackTitle = this.trackTitleFor(run, index);
    const item: ItemTransferProgress = {
      playlistId: run.playlistId,
      trackId,
      trackTitle,
      result,
    };
    this.itemsSignal.update((items) => [...items, item]);

    const current = this.playlistRunsSignal().find(
      (candidate) => candidate.playlistId === run.playlistId,
    );
    const processedTracks = (current?.processedTracks ?? 0) + 1;
    const patch: Partial<PlaylistRun> = { processedTracks };
    if (result === 'success') {
      patch.successCount = (current?.successCount ?? 0) + 1;
    } else {
      patch.warningCount = (current?.warningCount ?? 0) + 1;
    }
    this.updateRun(run.playlistId, patch);

    this.logSignal.update((log) =>
      [...log, { time: Date.now(), trackId, playlistTitle: run.title, trackTitle, result }].slice(
        -MAX_LOG_ENTRIES,
      ),
    );
  }

  private updateRun(playlistId: string, patch: Partial<PlaylistRun>): void {
    this.playlistRunsSignal.update((runs) =>
      runs.map((run) => (run.playlistId === playlistId ? { ...run, ...patch } : run)),
    );
  }

  private async waitWhilePaused(): Promise<void> {
    while (this.isPaused) {
      await new Promise<void>((resolve) => this.resumeWaiters.push(resolve));
    }
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
