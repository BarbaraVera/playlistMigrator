import { computed, inject, Injectable, signal } from '@angular/core';

import { PLAYLIST_LOAD_IDLE, Playlist, PlaylistLoadState } from '../models/playlist';
import { SpotifyPlaylistService } from './spotify-playlist.service';

@Injectable({ providedIn: 'root' })
export class PlaylistSelectionService {
  private readonly playlistService = inject(SpotifyPlaylistService);

  private readonly loadStateSignal = signal<PlaylistLoadState>(PLAYLIST_LOAD_IDLE);
  private readonly playlistsSignal = signal<readonly Playlist[]>([]);
  private readonly selectedIdsSignal = signal<readonly string[]>([]);
  private readonly querySignal = signal('');

  readonly loadState = this.loadStateSignal.asReadonly();
  readonly playlists = this.playlistsSignal.asReadonly();
  readonly selectedIds = this.selectedIdsSignal.asReadonly();
  readonly query = this.querySignal.asReadonly();

  readonly filteredPlaylists = computed(() => {
    const normalized = this.querySignal().trim().toLowerCase();
    if (!normalized) {
      return this.playlistsSignal();
    }
    return this.playlistsSignal().filter(
      (playlist) =>
        playlist.title.toLowerCase().includes(normalized) ||
        playlist.owner.toLowerCase().includes(normalized),
    );
  });

  readonly selectedCount = computed(() => this.selectedIdsSignal().length);

  readonly selectedPlaylists = computed(() => {
    return this.playlistsSignal().filter((playlist) => this.selectedIdsSignal().includes(playlist.id));
  });

  async load(force = false): Promise<void> {
    const current = this.loadStateSignal();
    if (current.status === 'loading' || (current.status === 'loaded' && !force)) {
      return;
    }

    this.loadStateSignal.set({ status: 'loading' });

    try {
      const playlists = await this.playlistService.list();
      this.playlistsSignal.set(playlists);
      this.loadStateSignal.set({ status: 'loaded', count: playlists.length });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudieron cargar las playlists';
      this.loadStateSignal.set({ status: 'error', error: message });
    }
  }

  setQuery(query: string): void {
    this.querySignal.set(query);
  }

  toggle(id: string): void {
    const current = this.selectedIdsSignal();
    const next = current.includes(id)
      ? current.filter((candidate) => candidate !== id)
      : [...current, id];
    this.selectedIdsSignal.set(next);
  }

  isSelected(id: string): boolean {
    return this.selectedIdsSignal().includes(id);
  }

  clearSelection(): void {
    this.selectedIdsSignal.set([]);
  }
}
