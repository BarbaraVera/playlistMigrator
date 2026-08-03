import { Component, computed, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LucideArrowRight, LucideCheck, LucideLibrary, LucideSearch } from '@lucide/angular';

import { PlatformId } from '../../core/models/platform';
import { ConnectionManagerService } from '../../core/services/connection-manager.service';
import { PlaylistSelectionService } from '../../core/services/playlist-selection.service';
import { CartoonyBadgeComponent } from '../../shared/components/cartoony-badge/cartoony-badge.component';
import { CartoonyButtonComponent } from '../../shared/components/cartoony-button/cartoony-button.component';
import { CartoonyCardComponent } from '../../shared/components/cartoony-card/cartoony-card.component';
import { CartoonySpinnerComponent } from '../../shared/components/cartoony-spinner/cartoony-spinner.component';

@Component({
  selector: 'app-playlist-selection',
  standalone: true,
  templateUrl: './playlist-selection.component.html',
  styleUrl: './playlist-selection.component.scss',
  imports: [
    CartoonyBadgeComponent,
    CartoonyButtonComponent,
    CartoonyCardComponent,
    CartoonySpinnerComponent,
    LucideArrowRight,
    LucideCheck,
    LucideLibrary,
    LucideSearch,
  ],
})
export class PlaylistSelectionComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly manager = inject(ConnectionManagerService);
  private readonly selection = inject(PlaylistSelectionService);

  protected readonly playlists = this.selection.filteredPlaylists;
  protected readonly totalCount = this.selection.playlists;
  protected readonly selectedCount = this.selection.selectedCount;
  protected readonly query = this.selection.query;
  protected readonly status = computed(() => this.selection.loadState().status);
  protected readonly error = computed(() => this.selection.loadState().error ?? '');
  protected readonly states = this.manager.states;

  protected readonly sourceConnected = computed(() => this.states().spotify.status === 'connected');
  protected readonly destinationConnected = computed(
    () => this.states()['youtube-music'].status === 'connected',
  );

  ngOnInit(): void {
    void this.selection.load();
  }

  protected onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selection.setQuery(input.value);
  }

  protected togglePlaylist(id: string): void {
    this.selection.toggle(id);
  }

  protected isSelected(id: string): boolean {
    return this.selection.isSelected(id);
  }

  protected retry(): void {
    void this.selection.load(true);
  }

  protected continueToTransfer(): void {
    if (this.selectedCount() > 0) {
      void this.router.navigate(['/transfer']);
    }
  }

  protected platformLabel(platform: PlatformId): string {
    return platform === 'spotify' ? 'Spotify' : 'YouTube Music';
  }
}
