import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ComponentFixture } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { providePlatformAuthServices } from '../../core/services/platform-auth.providers';
import { ConnectComponent } from './connect.component';

describe('ConnectComponent', () => {
  let fixture: ComponentFixture<ConnectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConnectComponent],
      providers: [provideRouter([]), providePlatformAuthServices()],
    }).compileComponents();

    fixture = TestBed.createComponent(ConnectComponent);
    fixture.detectChanges();
  });

  function actionButtons(): HTMLElement[] {
    return fixture.debugElement
      .queryAll(By.css('app-cartoony-button button'))
      .map((item) => item.nativeElement);
  }

  function connectAll(): void {
    const buttons = actionButtons();
    buttons[0].click();
    buttons[1].click();
    tick(5000);
    fixture.detectChanges();
  }

  it('muestra una tarjeta por plataforma', () => {
    const cards = fixture.debugElement.queryAll(By.css('app-cartoony-card'));
    expect(cards.length).toBe(2);
  });

  it('empieza con ambas tarjetas en "Desconectado" y botones "Conectar"', () => {
    const badges = fixture.debugElement.queryAll(By.css('app-cartoony-badge'));
    expect(badges.length).toBe(3);
    expect(badges[1].nativeElement.textContent).toContain('Desconectado');
    expect(badges[2].nativeElement.textContent).toContain('Desconectado');

    const buttons = actionButtons();
    expect(buttons.length).toBe(2);
    expect(buttons[0].textContent).toContain('Conectar');
    expect(buttons[1].textContent).toContain('Conectar');
  });

  it('muestra el contador de conexiones', () => {
    const counter = fixture.debugElement.query(By.css('app-cartoony-badge'));
    expect(counter.nativeElement.textContent).toContain('0 de 2 conectadas');
  });

  it('conecta Spotify, muestra spinner y cambia la tarjeta a "Conectado"', fakeAsync(() => {
    actionButtons()[0].click();
    fixture.detectChanges();

    const spinner = fixture.debugElement
      .queryAll(By.css('app-cartoony-button [data-test="spinner"]'))[0]
      .nativeElement as HTMLElement;
    expect(spinner.classList).toContain('opacity-100');

    tick(5000);
    fixture.detectChanges();

    const badges = fixture.debugElement.queryAll(By.css('app-cartoony-badge'));
    expect(badges[1].nativeElement.textContent).toContain('Conectado');
    expect(badges[0].nativeElement.textContent).toContain('1 de 2 conectadas');

    const buttons = actionButtons();
    expect(buttons[0].textContent).toContain('Desconectar');

    const cards = fixture.debugElement.queryAll(By.css('app-cartoony-card'));
    expect(cards[0].nativeElement.textContent).toContain('Camaleón Musical');
  }));

  it('desconecta Spotify al pulsar "Desconectar"', fakeAsync(() => {
    actionButtons()[0].click();
    tick(5000);
    fixture.detectChanges();

    actionButtons()[0].click();
    fixture.detectChanges();

    const badges = fixture.debugElement.queryAll(By.css('app-cartoony-badge'));
    expect(badges[1].nativeElement.textContent).toContain('Desconectado');
    expect(badges[0].nativeElement.textContent).toContain('0 de 2 conectadas');
  }));

  it('conecta ambas plataformas y muestra el estado completo', fakeAsync(() => {
    connectAll();

    const counter = fixture.debugElement.query(By.css('app-cartoony-badge'));
    expect(counter.nativeElement.textContent).toContain('2 de 2 conectadas');
  }));

  it('oculta el botón continuar hasta conectar ambas plataformas', () => {
    expect(fixture.debugElement.query(By.css('[data-test="continue-button"]'))).toBeNull();
  });

  it('muestra el botón continuar al conectar ambas plataformas', fakeAsync(() => {
    connectAll();

    const continueButton = fixture.debugElement.query(By.css('[data-test="continue-button"] button'));
    expect(continueButton).toBeTruthy();
    expect(continueButton.nativeElement.textContent).toContain('Continuar a seleccionar playlists');
  }));

  it('navega a /playlist-selection al pulsar continuar', fakeAsync(() => {
    connectAll();

    const router = TestBed.inject(Router);
    const spy = spyOn(router, 'navigate').and.resolveTo(true);

    const continueButton = fixture.debugElement.query(By.css('[data-test="continue-button"] button'));
    continueButton.nativeElement.click();

    expect(spy).toHaveBeenCalledWith(['/playlist-selection']);
  }));
});
