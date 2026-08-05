import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  LucideArrowRight,
  LucideCheck,
  LucideChevronDown,
  LucideChevronUp,
  LucideEye,
  LucideLibrary,
  LucideSearch,
} from '@lucide/angular';

import { Playlist, Track } from '../../core/models/playlist';
import { PlatformId } from '../../core/models/platform';
import { ConnectionManagerService } from '../../core/services/connection-manager.service';
import {
  MAX_SELECTABLE_PLAYLISTS,
  PlaylistSelectionService,
} from '../../core/services/playlist-selection.service';
import { SpotifyPlaylistService } from '../../core/services/spotify-playlist.service';
import { BackHomeComponent } from '../../shared/components/back-home/back-home.component';
import { CartoonyBadgeComponent } from '../../shared/components/cartoony-badge/cartoony-badge.component';
import { CartoonyButtonComponent } from '../../shared/components/cartoony-button/cartoony-button.component';
import { CartoonyCardComponent } from '../../shared/components/cartoony-card/cartoony-card.component';
import { CartoonyModalComponent } from '../../shared/components/cartoony-modal/cartoony-modal.component';
import { CartoonySpinnerComponent } from '../../shared/components/cartoony-spinner/cartoony-spinner.component';

@Component({
  selector: 'app-playlist-selection',
  standalone: true,
  templateUrl: './playlist-selection.component.html',
  styleUrl: './playlist-selection.component.scss',
  imports: [
    BackHomeComponent,
    CartoonyBadgeComponent,
    CartoonyButtonComponent,
    CartoonyCardComponent,
    CartoonyModalComponent,
    CartoonySpinnerComponent,
    LucideArrowRight,
    LucideCheck,
    LucideChevronDown,
    LucideChevronUp,
    LucideEye,
    LucideLibrary,
    LucideSearch,
  ],
})
export class PlaylistSelectionComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly manager = inject(ConnectionManagerService);
  private readonly selection = inject(PlaylistSelectionService);
  private readonly spotifyPlaylistService = inject(SpotifyPlaylistService);

  protected readonly playlists = this.selection.filteredPlaylists;
  protected readonly totalCount = this.selection.playlists;
  protected readonly selectedCount = this.selection.selectedCount;
  protected readonly selectionLimitReached = this.selection.selectionLimitReached;
  protected readonly maxSelectable = MAX_SELECTABLE_PLAYLISTS;
  protected readonly query = this.selection.query;
  protected readonly status = computed(() => this.selection.loadState().status);
  protected readonly error = computed(() => this.selection.loadState().error ?? '');
  protected readonly states = this.manager.states;

  protected readonly INITIAL_VISIBLE_COUNT = 9;
  private readonly visibleCount = signal(this.INITIAL_VISIBLE_COUNT);
  private readonly migratablePlaylists = computed(() =>
    this.playlists().filter((playlist) => playlist.migratable),
  );
  private readonly nonMigratablePlaylists = computed(() =>
    this.playlists().filter((playlist) => !playlist.migratable),
  );
  protected readonly visiblePlaylists = computed(() =>
    this.migratablePlaylists().slice(0, this.visibleCount()),
  );
  protected readonly sortedVisiblePlaylists = computed(() => [
    ...this.visiblePlaylists(),
    ...(this.allVisible() ? this.nonMigratablePlaylists() : []),
  ]);
  protected readonly hasMore = computed(() => this.migratablePlaylists().length > this.visibleCount());
  protected readonly allVisible = computed(
    () => this.visibleCount() >= this.migratablePlaylists().length,
  );
  protected readonly hiddenCount = computed(() =>
    Math.max(0, this.migratablePlaylists().length - this.visibleCount()),
  );

  protected readonly sourceConnected = computed(() => this.states().spotify.status === 'connected');
  protected readonly destinationConnected = computed(
    () => this.states()['youtube-music'].status === 'connected',
  );
  protected readonly hasNonMigratable = computed(() =>
    this.playlists().some((playlist) => !playlist.migratable),
  );

  private readonly previewPlaylist = signal<Playlist | null>(null);
  private readonly previewTracksSignal = signal<readonly Track[]>([]);
  private readonly previewLoadingSignal = signal(false);
  private readonly previewErrorSignal = signal<string | null>(null);

  protected readonly previewOpen = computed(() => this.previewPlaylist() !== null);
  protected readonly previewTitle = computed(() => this.previewPlaylist()?.title ?? '');
  protected readonly previewTracks = this.previewTracksSignal;
  protected readonly previewLoading = this.previewLoadingSignal;
  protected readonly previewError = this.previewErrorSignal;

  protected readonly selectedPlaylists = this.selection.selectedPlaylists;
  private readonly confirmOpenSignal = signal(false);
  protected readonly confirmOpen = this.confirmOpenSignal;

  protected readonly migratableHint =
    'Spotify solo permite leer las canciones de playlists propias o donde eres colaborador';

  ngOnInit(): void {
    void this.selection.load();
  }

  protected onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selection.setQuery(input.value);
    this.visibleCount.set(this.INITIAL_VISIBLE_COUNT);
  }

  protected showMore(): void {
    this.visibleCount.update((count) =>
      Math.min(count + this.INITIAL_VISIBLE_COUNT, this.playlists().length),
    );
  }

  protected showLess(): void {
    this.visibleCount.set(this.INITIAL_VISIBLE_COUNT);
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

  protected requestTransfer(): void {
    if (this.selectedCount() > 0) {
      this.confirmOpenSignal.set(true);
    }
  }

  protected confirmTransfer(): void {
    this.confirmOpenSignal.set(false);
    void this.router.navigate(['/transfer']);
  }

  protected cancelTransfer(): void {
    this.confirmOpenSignal.set(false);
  }

  protected platformLabel(platform: PlatformId): string {
    return platform === 'spotify' ? 'Spotify' : 'YouTube Music';
  }

  protected async openPreview(playlist: Playlist): Promise<void> {
    this.previewPlaylist.set(playlist);
    this.previewTracksSignal.set([]);
    this.previewErrorSignal.set(null);
    this.previewLoadingSignal.set(true);
    try {
      const tracks = await this.spotifyPlaylistService.listTracks(playlist.id);
      this.previewTracksSignal.set(tracks);
    } catch (error) {
      this.previewErrorSignal.set(
        error instanceof Error ? error.message : 'No se pudieron cargar las canciones',
      );
    } finally {
      this.previewLoadingSignal.set(false);
    }
  }

  protected closePreview(): void {
    this.previewPlaylist.set(null);
    this.previewTracksSignal.set([]);
    this.previewErrorSignal.set(null);
    this.previewLoadingSignal.set(false);
  }
}
