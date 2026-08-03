import { fakeAsync, TestBed, tick } from '@angular/core/testing';

import { PlatformProfile } from '../models/platform';
import { SpotifyAuthService } from './spotify-auth.service';

class FailingSpotifyAuthService extends SpotifyAuthService {
  protected override async authenticate(): Promise<PlatformProfile> {
    throw new Error('Token inválido');
  }
}

describe('SpotifyAuthService', () => {
  let service: SpotifyAuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SpotifyAuthService);
  });

  it('pasa por connecting y termina connected con perfil', fakeAsync(() => {
    let result: unknown;
    service.connect().then((state) => {
      result = state;
    });

    expect(service.state().status).toBe('connecting');

    tick(5000);

    expect(service.state().status).toBe('connected');
    expect(service.state().profile?.displayName).toBeTruthy();
    expect(result).toEqual(service.state());
  }));

  it('no vuelve a autenticar si ya está conectado', fakeAsync(() => {
    void service.connect();
    tick(5000);

    let calls = 0;
    void service.connect().then(() => {
      calls += 1;
    });
    tick(5000);

    expect(calls).toBe(1);
    expect(service.state().status).toBe('connected');
  }));

  it('desconecta y limpia el perfil', fakeAsync(() => {
    void service.connect();
    tick(5000);

    service.disconnect();

    expect(service.state().status).toBe('disconnected');
    expect(service.state().profile).toBeUndefined();
  }));

  it('captura errores de autenticación', fakeAsync(() => {
    const failing = new FailingSpotifyAuthService();
    let result: unknown;
    void failing.connect().then((state) => {
      result = state;
    });

    tick(5000);

    expect(service.state().status).toBe('disconnected');
    expect(failing.state().status).toBe('error');
    expect(failing.state().error).toBe('Token inválido');
    expect(result).toEqual(failing.state());
  }));
});
