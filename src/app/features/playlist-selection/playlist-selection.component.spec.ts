import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ComponentFixture } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { Playlist } from '../../core/models/playlist';
import { PLAYLIST_FIXTURE } from '../../core/services/playlist-selection.fixture';
import { providePlatformAuthServices } from '../../core/services/platform-auth.providers';
import { SpotifyPlaylistService } from '../../core/services/spotify-playlist.service';
import { PlaylistSelectionComponent } from './playlist-selection.component';

describe('PlaylistSelectionComponent', () => {
  let fixture: ComponentFixture<PlaylistSelectionComponent>;
  let playlistService: jasmine.SpyObj<SpotifyPlaylistService>;

  function mount(): ComponentFixture<PlaylistSelectionComponent> {
    const mounted = TestBed.createComponent(PlaylistSelectionComponent);
    mounted.detectChanges();
    return mounted;
  }

  function playlistButtons(): HTMLElement[] {
    return fixture.debugElement
      .queryAll(By.css('app-cartoony-card button[aria-pressed]'))
      .map((item) => item.nativeElement);
  }

  function continueButton(): HTMLButtonElement {
    return fixture.debugElement.query(By.css('footer app-cartoony-button button')).nativeElement;
  }

  beforeEach(async () => {
    TestBed.resetTestingModule();
    playlistService = jasmine.createSpyObj('SpotifyPlaylistService', ['list', 'listTracks']);
    await TestBed.configureTestingModule({
      imports: [PlaylistSelectionComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        providePlatformAuthServices(),
        { provide: SpotifyPlaylistService, useValue: playlistService },
      ],
    }).compileComponents();
  });

  it('muestra el spinner mientras carga', () => {
    playlistService.list.and.returnValue(new Promise<readonly Playlist[]>(() => undefined));
    fixture = mount();

    expect(fixture.debugElement.query(By.css('app-cartoony-spinner'))).toBeTruthy();
    expect(fixture.debugElement.queryAll(By.css('app-cartoony-card')).length).toBe(0);
  });

  it('renderiza las playlists tras cargar', async () => {
    playlistService.list.and.resolveTo(PLAYLIST_FIXTURE);
    fixture = mount();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.debugElement.queryAll(By.css('app-cartoony-card')).length).toBe(8);
    expect(fixture.debugElement.query(By.css('app-cartoony-spinner'))).toBeNull();
  });

  it('deshabilita continuar al inicio', async () => {
    playlistService.list.and.resolveTo(PLAYLIST_FIXTURE);
    fixture = mount();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(continueButton().disabled).toBe(true);
    expect(
      fixture.debugElement.query(By.css('footer app-cartoony-badge')).nativeElement.textContent,
    ).toContain('0 seleccionadas');
  });

  it('selecciona una playlist, actualiza el resumen y habilita continuar', async () => {
    playlistService.list.and.resolveTo(PLAYLIST_FIXTURE);
    fixture = mount();
    await fixture.whenStable();
    fixture.detectChanges();

    playlistButtons()[0].click();
    fixture.detectChanges();

    expect(continueButton().disabled).toBe(false);
    expect(
      fixture.debugElement.query(By.css('footer app-cartoony-badge')).nativeElement.textContent,
    ).toContain('1 seleccionada');
  });

  it('deselecciona una playlist al pulsar de nuevo', async () => {
    playlistService.list.and.resolveTo(PLAYLIST_FIXTURE);
    fixture = mount();
    await fixture.whenStable();
    fixture.detectChanges();

    const card = playlistButtons()[0];
    card.click();
    fixture.detectChanges();
    card.click();
    fixture.detectChanges();

    expect(continueButton().disabled).toBe(true);
    expect(
      fixture.debugElement.query(By.css('footer app-cartoony-badge')).nativeElement.textContent,
    ).toContain('0 seleccionadas');
  });

  it('limita la selección a 3 playlists y avisa al usuario', async () => {
    playlistService.list.and.resolveTo(PLAYLIST_FIXTURE);
    fixture = mount();
    await fixture.whenStable();
    fixture.detectChanges();

    const buttons = playlistButtons();
    buttons[0].click();
    buttons[1].click();
    buttons[2].click();
    fixture.detectChanges();

    expect(fixture.debugElement.nativeElement.textContent).toContain('Máximo 3 playlists');

    buttons[3].click();
    fixture.detectChanges();

    expect(fixture.debugElement.nativeElement.textContent).toContain('3 seleccionadas');
    expect(fixture.debugElement.nativeElement.textContent).not.toContain('4 seleccionadas');
  });

  it('marca como no migrable una playlist de otra persona y bloquea su selección', async () => {
    const playlists: readonly Playlist[] = [
      { ...PLAYLIST_FIXTURE[0], id: 'pl-ajena', title: 'Playlist Ajena', migratable: false },
    ];
    playlistService.list.and.resolveTo(playlists);
    fixture = mount();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.debugElement.nativeElement.textContent;
    expect(text).toContain('No migrable');
    expect(text).toContain('no se pueden migrar');

    const card = playlistButtons()[0];
    card.click();
    fixture.detectChanges();

    expect(continueButton().disabled).toBe(true);
    expect(
      fixture.debugElement.query(By.css('footer app-cartoony-badge')).nativeElement.textContent,
    ).toContain('0 seleccionadas');
  });

  it('muestra todas las no migrables al final de la lista', async () => {
    const ajenas: readonly Playlist[] = [
      { ...PLAYLIST_FIXTURE[0], id: 'pl-ajena-1', title: 'Ajena Uno', migratable: false },
      { ...PLAYLIST_FIXTURE[1], id: 'pl-ajena-2', title: 'Ajena Dos', migratable: false },
    ];
    playlistService.list.and.resolveTo([...PLAYLIST_FIXTURE.slice(0, 2), ...ajenas]);
    fixture = mount();
    await fixture.whenStable();
    fixture.detectChanges();

    const cards = fixture.debugElement
      .queryAll(By.css('app-cartoony-card'))
      .map((item) => item.nativeElement);
    expect(cards.length).toBe(4);
    expect(cards[0].textContent).toContain('Rock Clásico');
    expect(cards[1].textContent).toContain('Gym Power');
    expect(cards[2].textContent).toContain('Ajena Uno');
    expect(cards[3].textContent).toContain('Ajena Dos');
  });

  it('muestra las no migrables al final solo tras mostrar todas las migrables', async () => {
    const migrables: readonly Playlist[] = Array.from({ length: 12 }, (_, index) => ({
      id: `pl-migrable-${index}`,
      title: `Migrable ${index + 1}`,
      coverUrl: 'https://img/m.jpg',
      trackCount: 10,
      owner: 'Yo',
      migratable: true,
      platform: 'spotify',
    }));
    const ajenas: readonly Playlist[] = [
      { ...migrables[0], id: 'pl-ajena-1', title: 'Ajena Uno', migratable: false },
      { ...migrables[1], id: 'pl-ajena-2', title: 'Ajena Dos', migratable: false },
    ];
    playlistService.list.and.resolveTo([...migrables, ...ajenas]);
    fixture = mount();
    await fixture.whenStable();
    fixture.detectChanges();

    let cards = fixture.debugElement
      .queryAll(By.css('app-cartoony-card'))
      .map((item) => item.nativeElement);
    expect(cards.length).toBe(9);
    expect(fixture.debugElement.nativeElement.textContent).not.toContain('Ajena Uno');

    const moreButton = fixture.debugElement
      .queryAll(By.css('app-cartoony-button'))
      .map((item) => item.nativeElement)
      .find((button) => button.textContent.includes('Ver más'));
    expect(moreButton).toBeTruthy();
    moreButton!.querySelector('button')!.click();
    fixture.detectChanges();

    cards = fixture.debugElement
      .queryAll(By.css('app-cartoony-card'))
      .map((item) => item.nativeElement);
    expect(cards.length).toBe(14);
    expect(cards[11].textContent).toContain('Migrable 12');
    expect(cards[12].textContent).toContain('Ajena Uno');
    expect(cards[13].textContent).toContain('Ajena Dos');
  });

  it('filtra las playlists por búsqueda', async () => {
    playlistService.list.and.resolveTo(PLAYLIST_FIXTURE);
    fixture = mount();
    await fixture.whenStable();
    fixture.detectChanges();

    const input = fixture.debugElement.query(By.css('input[type="search"]'))
      .nativeElement as HTMLInputElement;
    input.value = 'gym';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const cards = fixture.debugElement.queryAll(By.css('app-cartoony-card'));
    expect(cards.length).toBe(1);
    expect(cards[0].nativeElement.textContent).toContain('Gym Power');
  });

  it('muestra solo las primeras 9 playlists y permite ver más', async () => {
    const many: readonly Playlist[] = Array.from({ length: 12 }, (_, index) => ({
      id: `pl-extra-${index}`,
      title: `Playlist extra ${index + 1}`,
      coverUrl: 'https://img/x.jpg',
      trackCount: 10 + index,
      owner: 'Camaleón Musical',
      migratable: true,
      platform: 'spotify',
    }));
    playlistService.list.and.resolveTo(many);
    fixture = mount();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.debugElement.queryAll(By.css('app-cartoony-card')).length).toBe(9);

    const moreButton = fixture.debugElement
      .queryAll(By.css('app-cartoony-button'))
      .map((item) => item.nativeElement)
      .find((button) => button.textContent.includes('Ver más'));
    expect(moreButton).toBeTruthy();
    expect(moreButton!.textContent).toContain('3');

    moreButton!.querySelector('button')!.click();
    fixture.detectChanges();

    expect(fixture.debugElement.queryAll(By.css('app-cartoony-card')).length).toBe(12);
  });

  it('navega a /transfer solo tras confirmar la migración', async () => {
    playlistService.list.and.resolveTo(PLAYLIST_FIXTURE);
    fixture = mount();
    await fixture.whenStable();
    fixture.detectChanges();

    const router = TestBed.inject(Router);
    const spy = spyOn(router, 'navigate').and.resolveTo(true);

    playlistButtons()[0].click();
    fixture.detectChanges();
    continueButton().click();
    fixture.detectChanges();

    expect(fixture.debugElement.nativeElement.textContent).toContain('¿Migrar estas playlists?');
    expect(spy).not.toHaveBeenCalled();

    const confirmButton = fixture.debugElement
      .queryAll(By.css('app-cartoony-button'))
      .map((item) => item.nativeElement)
      .find((button) => button.textContent.includes('Sí, migrar'));
    expect(confirmButton).toBeTruthy();
    confirmButton!.querySelector('button')!.click();
    fixture.detectChanges();

    expect(spy).toHaveBeenCalledWith(['/transfer']);
  });

  it('no navega si se cancela la confirmación', async () => {
    playlistService.list.and.resolveTo(PLAYLIST_FIXTURE);
    fixture = mount();
    await fixture.whenStable();
    fixture.detectChanges();

    const router = TestBed.inject(Router);
    const spy = spyOn(router, 'navigate').and.resolveTo(true);

    playlistButtons()[0].click();
    fixture.detectChanges();
    continueButton().click();
    fixture.detectChanges();

    const cancelButton = fixture.debugElement
      .queryAll(By.css('app-cartoony-button'))
      .map((item) => item.nativeElement)
      .find((button) => button.textContent.includes('Cancelar'));
    expect(cancelButton).toBeTruthy();
    cancelButton!.querySelector('button')!.click();
    fixture.detectChanges();

    expect(spy).not.toHaveBeenCalled();
  });

  it('muestra el error de carga y permite reintentar', async () => {
    playlistService.list.and.returnValues(
      Promise.reject(new Error('API caída')),
      Promise.resolve(PLAYLIST_FIXTURE),
    );
    fixture = mount();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.debugElement.nativeElement.textContent;
    expect(fixture.debugElement.query(By.css('app-cartoony-spinner'))).toBeNull();
    expect(text).toContain('API caída');
    expect(text).toContain('Reintentar');

    const retry = fixture.debugElement.query(By.css('[data-test="retry-button"] button')).nativeElement;
    retry.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('app-cartoony-spinner'))).toBeNull();
    expect(fixture.debugElement.queryAll(By.css('app-cartoony-card')).length).toBe(8);
  });

  it('muestra la vista previa de canciones de una playlist', async () => {
    playlistService.list.and.resolveTo(PLAYLIST_FIXTURE);
    playlistService.listTracks.and.resolveTo([
      { id: 't1', title: 'Rocket Man', artist: 'Elton John' },
      { id: 't2', title: 'Viva la Vida', artist: 'Coldplay' },
    ]);
    fixture = mount();
    await fixture.whenStable();
    fixture.detectChanges();

    const previewButton = fixture.debugElement
      .queryAll(By.css('button[aria-label^="Ver canciones"]'))
      .map((item) => item.nativeElement)[0];
    previewButton.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('app-cartoony-modal'))).toBeTruthy();
    expect(playlistService.listTracks).toHaveBeenCalledTimes(1);
    const text = fixture.debugElement.nativeElement.textContent;
    expect(text).toContain('Rocket Man');
    expect(text).toContain('Coldplay');
  });

  it('muestra un error si falla la carga de canciones', async () => {
    playlistService.list.and.resolveTo(PLAYLIST_FIXTURE);
    playlistService.listTracks.and.returnValue(Promise.reject(new Error('API caída')));
    fixture = mount();
    await fixture.whenStable();
    fixture.detectChanges();

    const previewButton = fixture.debugElement
      .queryAll(By.css('button[aria-label^="Ver canciones"]'))
      .map((item) => item.nativeElement)[0];
    previewButton.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.debugElement.nativeElement.textContent).toContain('API caída');
    expect(fixture.debugElement.nativeElement.textContent).not.toContain('Rocket Man');
  });
});
