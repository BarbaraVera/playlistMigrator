import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ComponentFixture } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { PlatformId } from '../../core/models/platform';
import { AuthService } from '../../core/services/auth.service';
import { providePlatformAuthServices } from '../../core/services/platform-auth.providers';
import { ConnectComponent } from './connect.component';

class StubAuthService {
  readonly checkStatus = jasmine.createSpy('checkStatus').and.returnValue(of([]));
  readonly login = jasmine.createSpy('login');
  readonly disconnectPlatform = jasmine.createSpy('disconnectPlatform').and.returnValue(of(undefined));
}

describe('ConnectComponent', () => {
  let auth: StubAuthService;

  function configure(
    params: Record<string, string> = {},
    connected: readonly PlatformId[] = [],
  ): void {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [ConnectComponent],
      providers: [
        provideRouter([]),
        providePlatformAuthServices(),
        { provide: AuthService, useClass: StubAuthService },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap(params) } },
        },
      ],
    });
    auth = TestBed.inject(AuthService) as unknown as StubAuthService;
    auth.checkStatus.and.returnValue(of(connected as PlatformId[]));
  }

  function create(): ComponentFixture<ConnectComponent> {
    const fixture = TestBed.createComponent(ConnectComponent);
    fixture.detectChanges();
    return fixture;
  }

  function actionButtons(fixture: ComponentFixture<ConnectComponent>): HTMLElement[] {
    return fixture.debugElement
      .queryAll(By.css('app-cartoony-button button'))
      .map((item) => item.nativeElement);
  }

  function platformBadges(fixture: ComponentFixture<ConnectComponent>): HTMLElement[] {
    return fixture.debugElement
      .queryAll(By.css('app-cartoony-badge'))
      .map((item) => item.nativeElement);
  }

  it('muestra una tarjeta por plataforma', () => {
    configure();
    const fixture = create();
    expect(fixture.debugElement.queryAll(By.css('app-cartoony-card')).length).toBe(2);
  });

  it('empieza con ambas tarjetas en "Desconectado" y botones "Conectar"', () => {
    configure();
    const fixture = create();

    const badges = platformBadges(fixture);
    expect(badges.length).toBe(3);
    expect(badges[1].textContent).toContain('Desconectado');
    expect(badges[2].textContent).toContain('Desconectado');

    const buttons = actionButtons(fixture);
    expect(buttons.length).toBe(2);
    expect(buttons[0].textContent).toContain('Conectar');
    expect(buttons[1].textContent).toContain('Conectar');
  });

  it('muestra el contador de conexiones', () => {
    configure();
    const fixture = create();
    const counter = fixture.debugElement.query(By.css('app-cartoony-badge'));
    expect(counter.nativeElement.textContent).toContain('0 de 2 conectadas');
  });

  it('al pulsar Conectar redirige al login y marca la tarjeta como conectando', fakeAsync(() => {
    configure();
    const fixture = create();

    actionButtons(fixture)[0].click();
    fixture.detectChanges();
    tick();

    expect(auth.login).toHaveBeenCalledWith('spotify');

    const badges = platformBadges(fixture);
    expect(badges[1].textContent).toContain('Conectando');
  }));

  it('refresca el estado consultando /me al iniciar', fakeAsync(() => {
    configure({}, ['spotify']);
    const fixture = create();
    tick();
    fixture.detectChanges();

    expect(auth.checkStatus).toHaveBeenCalled();

    const badges = platformBadges(fixture);
    expect(badges[1].textContent).toContain('Conectado');
    expect(badges[0].textContent).toContain('1 de 2 conectadas');
  }));

  it('muestra el toast de éxito y limpia los query params al volver del OAuth', fakeAsync(() => {
    configure({ status: 'success', platform: 'youtube' });
    const router = TestBed.inject(Router);
    const navigateSpy = spyOn(router, 'navigate').and.resolveTo(true);

    const fixture = create();
    tick();

    const toast = fixture.debugElement.query(By.css('[data-test="connect-toast"]'));
    expect(toast).toBeTruthy();
    expect(toast.nativeElement.textContent).toContain('YouTube Music conectado');
    expect(navigateSpy).toHaveBeenCalledWith([], { queryParams: {}, replaceUrl: true });
  }));

  it('muestra el toast de error con el mensaje del backend', fakeAsync(() => {
    configure({ status: 'error', platform: 'spotify', message: 'Token inválido' });
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);

    const fixture = create();
    tick();

    const toast = fixture.debugElement.query(By.css('[data-test="connect-toast"]'));
    expect(toast).toBeTruthy();
    expect(toast.nativeElement.textContent).toContain('No se pudo conectar Spotify');
    expect(toast.nativeElement.textContent).toContain('Token inválido');
  }));

  it('oculta el toast automáticamente tras unos segundos', fakeAsync(() => {
    configure({ status: 'success', platform: 'spotify' });
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);

    const fixture = create();
    tick();

    expect(fixture.debugElement.query(By.css('[data-test="connect-toast"]'))).toBeTruthy();

    tick(6000);
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('[data-test="connect-toast"]'))).toBeNull();
  }));

  it('permite cerrar el toast manualmente', fakeAsync(() => {
    configure({ status: 'success', platform: 'spotify' });
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);

    const fixture = create();
    tick();

    const closeButton = fixture.debugElement.query(By.css('[data-test="connect-toast"] button'));
    closeButton.nativeElement.click();
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('[data-test="connect-toast"]'))).toBeNull();
  }));

  it('oculta el botón continuar hasta conectar ambas plataformas', () => {
    configure();
    const fixture = create();
    expect(fixture.debugElement.query(By.css('[data-test="continue-button"]'))).toBeNull();
  });

  it('muestra el botón continuar al conectar ambas plataformas', fakeAsync(() => {
    configure({}, ['spotify', 'youtube-music']);
    const fixture = create();
    tick();
    fixture.detectChanges();

    const continueButton = fixture.debugElement.query(By.css('[data-test="continue-button"] button'));
    expect(continueButton).toBeTruthy();
  }));

  it('desconecta una plataforma al pulsar Desconectar y refresca el estado', fakeAsync(() => {
    configure({}, ['spotify']);
    const fixture = create();
    tick();
    fixture.detectChanges();

    const buttons = actionButtons(fixture);
    expect(buttons[0].textContent).toContain('Desconectar');

    auth.checkStatus.and.returnValue(of([] as PlatformId[]));
    buttons[0].click();
    tick();
    fixture.detectChanges();

    expect(auth.disconnectPlatform).toHaveBeenCalledWith('spotify');
    expect(auth.checkStatus).toHaveBeenCalled();

    const badges = platformBadges(fixture);
    expect(badges[1].textContent).toContain('Desconectado');
    expect(badges[0].textContent).toContain('0 de 2 conectadas');
  }));

  it('navega a /playlist-selection al pulsar continuar', fakeAsync(() => {
    configure({}, ['spotify', 'youtube-music']);
    const router = TestBed.inject(Router);
    const navigateSpy = spyOn(router, 'navigate').and.resolveTo(true);

    const fixture = create();
    tick();
    fixture.detectChanges();

    const continueButton = fixture.debugElement.query(By.css('[data-test="continue-button"] button'));
    continueButton.nativeElement.click();

    expect(navigateSpy).toHaveBeenCalledWith(['/playlist-selection']);
  }));
});
