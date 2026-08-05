import { TestBed } from '@angular/core/testing';

import { Playlist } from '../models/playlist';
import { PLAYLIST_FIXTURE } from './playlist-selection.fixture';
import { PlaylistSelectionService } from './playlist-selection.service';
import { SpotifyPlaylistService } from './spotify-playlist.service';

describe('PlaylistSelectionService', () => {
  let service: PlaylistSelectionService;
  let playlistService: jasmine.SpyObj<SpotifyPlaylistService>;

  beforeEach(() => {
    TestBed.resetTestingModule();
    playlistService = jasmine.createSpyObj('SpotifyPlaylistService', ['list']);
    TestBed.configureTestingModule({
      providers: [{ provide: SpotifyPlaylistService, useValue: playlistService }],
    });
    service = TestBed.inject(PlaylistSelectionService);
  });

  it('empieza vacío y en estado idle', () => {
    expect(service.loadState().status).toBe('idle');
    expect(service.playlists()).toEqual([]);
    expect(service.selectedCount()).toBe(0);
    expect(service.filteredPlaylists()).toEqual([]);
  });

  it('marca loading mientras la petición está en vuelo', async () => {
    let resolvePlaylists!: (value: readonly Playlist[]) => void;
    playlistService.list.and.returnValue(
      new Promise<readonly Playlist[]>((resolve) => {
        resolvePlaylists = resolve;
      }),
    );

    const loading = service.load();
    expect(service.loadState().status).toBe('loading');

    resolvePlaylists(PLAYLIST_FIXTURE);
    await loading;

    expect(service.loadState().status).toBe('loaded');
    expect(service.loadState().count).toBe(8);
    expect(service.playlists().length).toBe(8);
  });

  it('carga las playlists y marca loaded', async () => {
    playlistService.list.and.resolveTo(PLAYLIST_FIXTURE);
    await service.load();

    expect(service.loadState().status).toBe('loaded');
    expect(service.loadState().count).toBe(8);
    expect(service.playlists().length).toBe(8);
  });

  it('no recarga si ya está loaded', async () => {
    playlistService.list.and.resolveTo(PLAYLIST_FIXTURE);
    await service.load();
    await service.load();

    expect(playlistService.list).toHaveBeenCalledTimes(1);
  });

  it('filtra por título y por propietario', async () => {
    playlistService.list.and.resolveTo(PLAYLIST_FIXTURE);
    await service.load();

    service.setQuery('gym');
    expect(service.filteredPlaylists().map((playlist) => playlist.id)).toEqual(['pl-gym-power']);

    service.setQuery('DJ Chispa');
    expect(service.filteredPlaylists().length).toBe(2);

    service.setQuery('');
    expect(service.filteredPlaylists().length).toBe(8);
  });

  it('selecciona y deselecciona playlists', async () => {
    playlistService.list.and.resolveTo(PLAYLIST_FIXTURE);
    await service.load();

    service.toggle('pl-rock-clasico');
    expect(service.isSelected('pl-rock-clasico')).toBe(true);
    expect(service.selectedCount()).toBe(1);
    expect(service.selectedPlaylists().map((playlist) => playlist.id)).toEqual(['pl-rock-clasico']);

    service.toggle('pl-gym-power');
    expect(service.selectedCount()).toBe(2);

    service.toggle('pl-rock-clasico');
    expect(service.isSelected('pl-rock-clasico')).toBe(false);
    expect(service.selectedCount()).toBe(1);
  });

  it('limpia la selección', async () => {
    playlistService.list.and.resolveTo(PLAYLIST_FIXTURE);
    await service.load();

    service.toggle('pl-rock-clasico');
    service.toggle('pl-gym-power');
    service.clearSelection();

    expect(service.selectedCount()).toBe(0);
  });

  it('no selecciona más allá del máximo por migración', async () => {
    playlistService.list.and.resolveTo(PLAYLIST_FIXTURE);
    await service.load();

    service.toggle('pl-rock-clasico');
    service.toggle('pl-gym-power');
    service.toggle('pl-chill-tarde');
    expect(service.selectedCount()).toBe(3);
    expect(service.selectionLimitReached()).toBe(true);

    service.toggle('pl-roadtrip-2026');
    expect(service.selectedCount()).toBe(3);
    expect(service.isSelected('pl-roadtrip-2026')).toBe(false);

    service.toggle('pl-rock-clasico');
    expect(service.selectedCount()).toBe(2);
    service.toggle('pl-roadtrip-2026');
    expect(service.selectedCount()).toBe(3);
  });

  it('no selecciona playlists no migrables', async () => {
    const playlists: readonly Playlist[] = [
      { ...PLAYLIST_FIXTURE[0], id: 'pl-ajena', title: 'Playlist Ajena', migratable: false },
    ];
    playlistService.list.and.resolveTo(playlists);
    await service.load();

    service.toggle('pl-ajena');
    expect(service.selectedCount()).toBe(0);
    expect(service.isSelected('pl-ajena')).toBe(false);
  });

  it('captura errores de carga', async () => {
    playlistService.list.and.rejectWith(new Error('API caída'));
    await service.load();

    expect(service.loadState().status).toBe('error');
    expect(service.loadState().error).toBe('API caída');
  });
});
