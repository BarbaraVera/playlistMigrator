import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ComponentFixture } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { providePlatformAuthServices } from '../../core/services/platform-auth.providers';
import { SpotifyPlaylistService } from '../../core/services/spotify-playlist.service';
import { PlaylistSelectionComponent } from './playlist-selection.component';

describe('PlaylistSelectionComponent', () => {
  let fixture: ComponentFixture<PlaylistSelectionComponent>;

  function mount(): ComponentFixture<PlaylistSelectionComponent> {
    const mounted = TestBed.createComponent(PlaylistSelectionComponent);
    mounted.detectChanges();
    return mounted;
  }

  function playlistButtons(): HTMLElement[] {
    return fixture.debugElement
      .queryAll(By.css('app-cartoony-card button'))
      .map((item) => item.nativeElement);
  }

  function continueButton(): HTMLButtonElement {
    return fixture.debugElement.query(By.css('footer app-cartoony-button button')).nativeElement;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlaylistSelectionComponent],
      providers: [provideRouter([]), providePlatformAuthServices()],
    }).compileComponents();
  });

  it('muestra el spinner mientras carga', () => {
    fixture = mount();
    expect(fixture.debugElement.query(By.css('app-cartoony-spinner'))).toBeTruthy();
    expect(fixture.debugElement.queryAll(By.css('app-cartoony-card')).length).toBe(0);
  });

  it('renderiza las playlists tras cargar', fakeAsync(() => {
    fixture = mount();
    tick(2000);
    fixture.detectChanges();

    expect(fixture.debugElement.queryAll(By.css('app-cartoony-card')).length).toBe(8);
    expect(fixture.debugElement.query(By.css('app-cartoony-spinner'))).toBeNull();
  }));

  it('deshabilita continuar al inicio', fakeAsync(() => {
    fixture = mount();
    tick(2000);
    fixture.detectChanges();

    expect(continueButton().disabled).toBe(true);
    expect(
      fixture.debugElement.query(By.css('footer app-cartoony-badge')).nativeElement.textContent,
    ).toContain('0 seleccionadas');
  }));

  it('selecciona una playlist, actualiza el resumen y habilita continuar', fakeAsync(() => {
    fixture = mount();
    tick(2000);
    fixture.detectChanges();

    playlistButtons()[0].click();
    fixture.detectChanges();

    expect(continueButton().disabled).toBe(false);
    expect(
      fixture.debugElement.query(By.css('footer app-cartoony-badge')).nativeElement.textContent,
    ).toContain('1 seleccionada');
  }));

  it('deselecciona una playlist al pulsar de nuevo', fakeAsync(() => {
    fixture = mount();
    tick(2000);
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
  }));

  it('filtra las playlists por búsqueda', fakeAsync(() => {
    fixture = mount();
    tick(2000);
    fixture.detectChanges();

    const input = fixture.debugElement.query(By.css('input[type="search"]'))
      .nativeElement as HTMLInputElement;
    input.value = 'gym';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const cards = fixture.debugElement.queryAll(By.css('app-cartoony-card'));
    expect(cards.length).toBe(1);
    expect(cards[0].nativeElement.textContent).toContain('Gym Power');
  }));

  it('navega a /transfer al continuar', fakeAsync(() => {
    fixture = mount();
    tick(2000);
    fixture.detectChanges();

    const router = TestBed.inject(Router);
    const spy = spyOn(router, 'navigate').and.resolveTo(true);

    playlistButtons()[0].click();
    fixture.detectChanges();
    continueButton().click();

    expect(spy).toHaveBeenCalledWith(['/transfer']);
  }));

  it('muestra el error de carga y permite reintentar', fakeAsync(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [PlaylistSelectionComponent],
      providers: [provideRouter([]), providePlatformAuthServices()],
    });
    const playlistService = TestBed.inject(SpotifyPlaylistService);
    spyOn(playlistService, 'list').and.rejectWith(new Error('API caída'));

    const errorFixture = TestBed.createComponent(PlaylistSelectionComponent);
    errorFixture.detectChanges();
    tick(2000);
    errorFixture.detectChanges();

    const text = errorFixture.debugElement.nativeElement.textContent;
    expect(errorFixture.debugElement.query(By.css('app-cartoony-spinner'))).toBeNull();
    expect(text).toContain('API caída');
    expect(text).toContain('Reintentar');
  }));
});
