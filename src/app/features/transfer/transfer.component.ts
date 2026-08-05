import { Component, computed, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  LucideArrowRight,
  LucideExternalLink,
  LucideMusic2,
  LucidePartyPopper,
  LucideRotateCcw,
  LucideSquare,
} from '@lucide/angular';

import { ConnectionManagerService } from '../../core/services/connection-manager.service';
import { PlaylistSelectionService } from '../../core/services/playlist-selection.service';
import { TransferRunnerService } from '../../core/services/transfer-runner.service';
import { PlaylistRun } from '../../core/models/transfer';
import { BackHomeComponent } from '../../shared/components/back-home/back-home.component';
import { CartoonyBadgeComponent } from '../../shared/components/cartoony-badge/cartoony-badge.component';
import { CartoonyButtonComponent } from '../../shared/components/cartoony-button/cartoony-button.component';
import { CartoonyCardComponent } from '../../shared/components/cartoony-card/cartoony-card.component';
import { CartoonyProgressBarComponent } from '../../shared/components/cartoony-progress-bar/cartoony-progress-bar.component';
import { CartoonySpinnerComponent } from '../../shared/components/cartoony-spinner/cartoony-spinner.component';

@Component({
  selector: 'app-transfer',
  standalone: true,
  templateUrl: './transfer.component.html',
  styleUrl: './transfer.component.scss',
  imports: [
    BackHomeComponent,
    CartoonyBadgeComponent,
    CartoonyButtonComponent,
    CartoonyCardComponent,
    CartoonyProgressBarComponent,
    CartoonySpinnerComponent,
    LucideArrowRight,
    LucideExternalLink,
    LucideMusic2,
    LucidePartyPopper,
    LucideRotateCcw,
    LucideSquare,
  ],
})
export class TransferComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly runner = inject(TransferRunnerService);
  private readonly selection = inject(PlaylistSelectionService);
  private readonly manager = inject(ConnectionManagerService);

  protected readonly status = this.runner.status;
  protected readonly percent = this.runner.percent;
  protected readonly totalTracks = this.runner.totalTracks;
  protected readonly summary = this.runner.summary;
  protected readonly playlistRuns = this.runner.playlistRuns;
  protected readonly errorMessage = this.runner.errorMessage;
  protected readonly states = this.manager.states;

  protected readonly isInProgress = computed(() => this.status() === 'in_progress');
  protected readonly isCompleted = computed(() => this.status() === 'completed');
  protected readonly isCancelled = computed(() => this.status() === 'cancelled');

  ngOnInit(): void {
    if (this.selection.selectedCount() === 0) {
      void this.router.navigate(['/playlist-selection']);
      return;
    }
    if (this.runner.status() === 'idle') {
      this.runner.start();
    }
  }

  protected cancel(): void {
    this.runner.cancel();
  }

  protected goToYoutubeMusic(): void {
    window.open('https://music.youtube.com', '_blank', 'noopener');
  }

  protected migrateMore(): void {
    this.selection.clearSelection();
    this.runner.reset();
    void this.router.navigate(['/playlist-selection']);
  }

  protected goBackToSelection(): void {
    this.selection.clearSelection();
    this.runner.reset();
    void this.router.navigate(['/playlist-selection']);
  }

  protected playlistPercent(run: PlaylistRun): number {
    return run.totalTracks > 0 ? Math.round((run.processedTracks / run.totalTracks) * 100) : 0;
  }

  protected runStatusBadge(run: PlaylistRun): 'neutral' | 'info' | 'success' {
    switch (run.status) {
      case 'done':
        return 'success';
      case 'running':
        return 'info';
      default:
        return 'neutral';
    }
  }

  protected runStatusLabel(run: PlaylistRun): string {
    switch (run.status) {
      case 'done':
        return '¡Listo!';
      case 'running':
        return 'En proceso';
      default:
        return 'En cola';
    }
  }

  protected formatElapsed(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}
