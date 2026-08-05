import { HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Subscription } from 'rxjs';

import {
  PlaylistRun,
  TransferProgress,
  TransferResponse,
  TransferStatus,
  TransferSummary,
} from '../models/transfer';
import { PlaylistSelectionService } from './playlist-selection.service';
import { TransferService } from './transfer.service';

export const PROGRESS_POLL_INTERVAL_MS = 1000;

@Injectable({ providedIn: 'root' })
export class TransferRunnerService {
  private readonly selection = inject(PlaylistSelectionService);
  private readonly transfer = inject(TransferService);

  private subscription: Subscription | null = null;
  private progressTimer: ReturnType<typeof setInterval> | null = null;

  private readonly statusSignal = signal<TransferStatus>('idle');
  private readonly playlistRunsSignal = signal<readonly PlaylistRun[]>([]);
  private readonly startedAtSignal = signal<number | null>(null);
  private readonly finishedAtSignal = signal<number | null>(null);
  private readonly errorMessageSignal = signal<string | null>(null);
  private readonly nowSignal = signal(Date.now());

  readonly status = this.statusSignal.asReadonly();
  readonly playlistRuns = this.playlistRunsSignal.asReadonly();
  readonly errorMessage = this.errorMessageSignal.asReadonly();

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
    this.nowSignal();
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

    this.statusSignal.set('in_progress');
    this.playlistRunsSignal.set(runs);
    this.startedAtSignal.set(Date.now());
    this.finishedAtSignal.set(null);
    this.startProgressPolling();

    const playlistIds = selected.map((playlist) => playlist.id);
    this.subscription?.unsubscribe();
    this.subscription = this.transfer.migrate(playlistIds).subscribe({
      next: (result) => this.complete(result),
      error: (error) => this.fail(error),
    });
  }

  cancel(): void {
    if (this.statusSignal() !== 'in_progress') {
      return;
    }
    this.stopProgressPolling();
    this.subscription?.unsubscribe();
    this.subscription = null;
    this.finishedAtSignal.set(Date.now());
    this.statusSignal.set('cancelled');
  }

  reset(): void {
    this.stopProgressPolling();
    this.subscription?.unsubscribe();
    this.subscription = null;
    this.statusSignal.set('idle');
    this.playlistRunsSignal.set([]);
    this.startedAtSignal.set(null);
    this.finishedAtSignal.set(null);
    this.errorMessageSignal.set(null);
  }

  private startProgressPolling(): void {
    this.stopProgressPolling();
    this.progressTimer = setInterval(() => {
      this.nowSignal.set(Date.now());
      this.transfer.fetchProgress().subscribe({
        next: (progress) => this.applyProgress(progress),
        error: () => undefined,
      });
    }, PROGRESS_POLL_INTERVAL_MS);
  }

  private stopProgressPolling(): void {
    if (this.progressTimer !== null) {
      clearInterval(this.progressTimer);
      this.progressTimer = null;
    }
  }

  private applyProgress(progress: TransferProgress): void {
    this.playlistRunsSignal.update((runs) =>
      runs.map((run) => {
        const entry = progress.find((item) => item.playlist_id === run.playlistId);
        if (entry === undefined) {
          return run;
        }
        return {
          ...run,
          totalTracks: entry.total_tracks > 0 ? entry.total_tracks : run.totalTracks,
          processedTracks: Math.max(run.processedTracks, entry.processed_tracks),
          status: entry.processed_tracks > 0 ? ('running' as const) : run.status,
        };
      }),
    );
  }

  private complete(result: TransferResponse): void {
    this.stopProgressPolling();
    this.playlistRunsSignal.update((runs) => {
      return runs.map((run) => {
        const migrated = result.results.find((item) => item.playlist_id === run.playlistId);
        return {
          ...run,
          processedTracks: migrated?.total_tracks ?? 0,
          successCount: migrated?.successful_tracks ?? 0,
          warningCount: migrated?.failed_tracks ?? 0,
          status: 'done' as const,
        };
      });
    });
    this.finishedAtSignal.set(Date.now());
    this.statusSignal.set('completed');
  }

  private fail(error?: unknown): void {
    this.stopProgressPolling();
    this.errorMessageSignal.set(this.extractErrorMessage(error));
    this.finishedAtSignal.set(Date.now());
    this.statusSignal.set('failed');
  }

  private extractErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const body = error.error as {
        error?: { message?: string };
        message?: string;
      } | null;
      if (body?.error?.message) {
        return body.error.message;
      }
      if (body?.message) {
        return body.message;
      }
      return `El servidor respondió con el código ${error.status}.`;
    }
    return 'No se pudo conectar con el servidor.';
  }
}
