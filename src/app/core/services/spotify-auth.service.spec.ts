import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { AuthService } from './auth.service';
import { SpotifyAuthService } from './spotify-auth.service';

class StubAuthService {
  readonly checkStatus = jasmine.createSpy('checkStatus').and.returnValue(of([]));
  readonly login = jasmine.createSpy('login');
  readonly disconnectPlatform = jasmine.createSpy('disconnectPlatform').and.returnValue(of(undefined));
}

describe('SpotifyAuthService', () => {
  let service: SpotifyAuthService;
  let auth: StubAuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useClass: StubAuthService }],
    });
    service = TestBed.inject(SpotifyAuthService);
    auth = TestBed.inject(AuthService) as unknown as StubAuthService;
  });

  it('expone la plataforma spotify', () => {
    expect(service.platform).toBe('spotify');
  });

  it('pasa a connecting y redirige al login de la plataforma', () => {
    void service.connect();

    expect(service.state().status).toBe('connecting');
    expect(auth.login).toHaveBeenCalledWith('spotify');
  });

  it('no redirige de nuevo si ya está conectando', () => {
    void service.connect();
    void service.connect();

    expect(auth.login).toHaveBeenCalledTimes(1);
  });

  it('marca connected al refrescar con la plataforma conectada', () => {
    service.refresh(true);

    expect(service.state().status).toBe('connected');
  });

  it('vuelve a disconnected al refrescar sin conexión', () => {
    service.refresh(true);
    service.refresh(false);

    expect(service.state().status).toBe('disconnected');
  });

  it('desconecta vía la API y limpia el estado', async () => {
    service.refresh(true);
    await service.disconnect();

    expect(auth.disconnectPlatform).toHaveBeenCalledWith('spotify');
    expect(service.state().status).toBe('disconnected');
  });

  it('marca error si la API de desconexión falla', async () => {
    service.refresh(true);
    auth.disconnectPlatform.and.returnValue(throwError(() => new Error('fallo')));

    await service.disconnect();

    expect(service.state().status).toBe('error');
  });
});
