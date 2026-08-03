import { fakeAsync, TestBed, tick } from '@angular/core/testing';

import { Playlist } from '../models/playlist';
import { PlaylistSelectionService } from './playlist-selection.service';
import { SpotifyPlaylistService } from './spotify-playlist.service';

class FailingPlaylistService extends SpotifyPlaylistService {
  override async list(): Promise<readonly Playlist[]> {
    throw new Error('API caída');
  }
}

describe('PlaylistSelectionService', () => {
  let service: PlaylistSelectionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PlaylistSelectionService);
  });

  it('empieza vacío y en estado idle', () => {
    expect(service.loadState().status).toBe('idle');
    expect(service.playlists()).toEqual([]);
    expect(service.selectedCount()).toBe(0);
    expect(service.filteredPlaylists()).toEqual([]);
  });

  it('carga las playlists y marca loaded', fakeAsync(() => {
    let settled = false;
    void service.load().then(() => {
      settled = true;
    });

    expect(service.loadState().status).toBe('loading');

    tick(2000);

    expect(settled).toBe(true);
    expect(service.loadState().status).toBe('loaded');
    expect(service.loadState().count).toBe(8);
    expect(service.playlists().length).toBe(8);
  }));

  it('no recarga si ya está loaded', fakeAsync(() => {
    const playlistService = TestBed.inject(SpotifyPlaylistService);
    const spy = spyOn(playlistService, 'list').and.callThrough();

    void service.load();
    tick(2000);
    void service.load();
    tick(2000);

    expect(spy).toHaveBeenCalledTimes(1);
  }));

  it('filtra por título y por propietario', fakeAsync(() => {
    void service.load();
    tick(2000);

    service.setQuery('gym');
    expect(service.filteredPlaylists().map((playlist) => playlist.id)).toEqual(['pl-gym-power']);

    service.setQuery('DJ Chispa');
    expect(service.filteredPlaylists().length).toBe(2);

    service.setQuery('');
    expect(service.filteredPlaylists().length).toBe(8);
  }));

  it('selecciona y deselecciona playlists', fakeAsync(() => {
    void service.load();
    tick(2000);

    service.toggle('pl-rock-clasico');
    expect(service.isSelected('pl-rock-clasico')).toBe(true);
    expect(service.selectedCount()).toBe(1);
    expect(service.selectedPlaylists().map((playlist) => playlist.id)).toEqual(['pl-rock-clasico']);

    service.toggle('pl-gym-power');
    expect(service.selectedCount()).toBe(2);

    service.toggle('pl-rock-clasico');
    expect(service.isSelected('pl-rock-clasico')).toBe(false);
    expect(service.selectedCount()).toBe(1);
  }));

  it('limpia la selección', fakeAsync(() => {
    void service.load();
    tick(2000);

    service.toggle('pl-rock-clasico');
    service.toggle('pl-gym-power');
    service.clearSelection();

    expect(service.selectedCount()).toBe(0);
  }));

  it('captura errores de carga', fakeAsync(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [{ provide: SpotifyPlaylistService, useClass: FailingPlaylistService }],
    });
    const failing = TestBed.inject(PlaylistSelectionService);

    let settled = false;
    void failing.load().then(() => {
      settled = true;
    });
    tick(2000);

    expect(settled).toBe(true);
    expect(failing.loadState().status).toBe('error');
    expect(failing.loadState().error).toBe('API caída');
  }));
});
