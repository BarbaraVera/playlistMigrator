import { provideHttpClient } from '@angular/common/http';
import { fakeAsync, flush, TestBed, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ComponentFixture } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, Subject } from 'rxjs';

import { providePlatformAuthServices } from '../../core/services/platform-auth.providers';
import { PLAYLIST_FIXTURE } from '../../core/services/playlist-selection.fixture';
import { PlaylistSelectionService } from '../../core/services/playlist-selection.service';
import { SpotifyPlaylistService } from '../../core/services/spotify-playlist.service';
import { TransferResponse } from '../../core/models/transfer';
import { TransferRunnerService } from '../../core/services/transfer-runner.service';
import { TransferService } from '../../core/services/transfer.service';
import { TransferComponent } from './transfer.component';

const RESPONSE: TransferResponse = {
  playlists_migrated: 1,
  total_tracks: 19,
  successful_tracks: 16,
  failed_tracks: 3,
  results: [
    {
      playlist_id: 'pl-duermete-bebe',
      title: 'Dúrmete, Bebé',
      youtube_playlist_id: 'yt-1',
      youtube_url: 'https://music.youtube.com/playlist?list=yt-1',
      total_tracks: 19,
      successful_tracks: 16,
      failed_tracks: 3,
    },
  ],
};

describe('TransferComponent', () => {
  let transferService: jasmine.SpyObj<TransferService>;

  function select(ids: readonly string[]): void {
    const selection = TestBed.inject(PlaylistSelectionService);
    selection.load();
    tick(900);
    for (const id of ids) {
      selection.toggle(id);
    }
  }

  function createFixture(): ComponentFixture<TransferComponent> {
    const fixture = TestBed.createComponent(TransferComponent);
    fixture.detectChanges();
    return fixture;
  }

  function clickButton(fixture: ComponentFixture<TransferComponent>, testId: string): void {
    const button = fixture.debugElement.query(By.css(`[data-test=${testId}] button`))
      .nativeElement as HTMLButtonElement;
    button.click();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    transferService = jasmine.createSpyObj('TransferService', ['migrate', 'fetchProgress']);
    transferService.fetchProgress.and.returnValue(of([]));
    await TestBed.configureTestingModule({
      imports: [TransferComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        providePlatformAuthServices(),
        {
          provide: SpotifyPlaylistService,
          useValue: { list: () => Promise.resolve(PLAYLIST_FIXTURE) },
        },
        { provide: TransferService, useValue: transferService },
      ],
    }).compileComponents();
  });

  it('redirige a selección sin playlists marcadas', fakeAsync(() => {
    const router = TestBed.inject(Router);
    const navigateSpy = spyOn(router, 'navigate').and.resolveTo(true);

    const fixture = createFixture();
    tick();

    expect(navigateSpy).toHaveBeenCalledWith(['/playlist-selection']);
    expect(transferService.migrate).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Paso 3 · Transferencia');
  }));

  it('arranca la migración y muestra el progreso', fakeAsync(() => {
    const subject = new Subject<TransferResponse>();
    transferService.migrate.and.returnValue(subject.asObservable());

    select(['pl-rock-clasico', 'pl-chill-tarde']);
    const fixture = createFixture();
    tick();

    expect(transferService.migrate).toHaveBeenCalledWith(['pl-rock-clasico', 'pl-chill-tarde']);

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Progreso general');
    expect(text).toContain('Migrando en el servidor…');
    expect(text).toContain('Playlists en proceso');
    expect(text).toContain('Rock Clásico');
    expect(text).toContain('Chill de Tarde');
    expect(text).toContain('Cancelar transferencia');
    expect(fixture.debugElement.query(By.css('app-cartoony-spinner'))).toBeTruthy();

    subject.complete();
    flush();
  }));

  it('muestra la pantalla final con las métricas reales al terminar', fakeAsync(() => {
    const subject = new Subject<TransferResponse>();
    transferService.migrate.and.returnValue(subject.asObservable());

    const runner = TestBed.inject(TransferRunnerService);
    select(['pl-duermete-bebe']);
    const fixture = createFixture();
    tick();

    subject.next(RESPONSE);
    subject.complete();
    tick();
    fixture.detectChanges();

    expect(runner.status()).toBe('completed');
    expect(runner.summary().totalPlaylists).toBe(1);
    expect(runner.summary().processedTracks).toBe(19);
    expect(runner.summary().successfulTracks).toBe(16);
    expect(runner.summary().failedTracks).toBe(3);

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Mission Complete');
    expect(text).toContain('Ir a YouTube Music');
    expect(text).toContain('Migrar más playlists');
    expect(text).toContain('16');
    expect(text).toContain('3');
  }));

  it('migrar más playlists resetea y vuelve a selección', fakeAsync(() => {
    const router = TestBed.inject(Router);
    const navigateSpy = spyOn(router, 'navigate').and.resolveTo(true);
    const selection = TestBed.inject(PlaylistSelectionService);
    const runner = TestBed.inject(TransferRunnerService);
    const subject = new Subject<TransferResponse>();
    transferService.migrate.and.returnValue(subject.asObservable());

    select(['pl-gym-power']);
    const fixture = createFixture();
    tick();
    subject.next(RESPONSE);
    subject.complete();
    tick();
    fixture.detectChanges();

    clickButton(fixture, 'migrate-button');
    tick();

    expect(runner.status()).toBe('idle');
    expect(selection.selectedCount()).toBe(0);
    expect(navigateSpy).toHaveBeenCalledWith(['/playlist-selection']);
  }));

  it('cancela la transferencia desde la UI', fakeAsync(() => {
    const runner = TestBed.inject(TransferRunnerService);
    const subject = new Subject<TransferResponse>();
    transferService.migrate.and.returnValue(subject.asObservable());

    select(['pl-roadtrip-2026']);
    const fixture = createFixture();
    tick();

    clickButton(fixture, 'cancel-button');
    fixture.detectChanges();

    expect(runner.status()).toBe('cancelled');
    expect(fixture.nativeElement.textContent).toContain('Transferencia cancelada');
  }));

  it('muestra el error cuando el backend falla', fakeAsync(() => {
    const runner = TestBed.inject(TransferRunnerService);
    const subject = new Subject<TransferResponse>();
    transferService.migrate.and.returnValue(subject.asObservable());

    select(['pl-roadtrip-2026']);
    const fixture = createFixture();
    tick();

    subject.error(new Error('API caída'));
    tick();
    fixture.detectChanges();

    expect(runner.status()).toBe('failed');
    expect(fixture.nativeElement.textContent).toContain('Algo salió mal');
  }));
});
