import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { AuthService } from './auth.service';
import { ConnectionManagerService } from './connection-manager.service';
import { providePlatformAuthServices } from './platform-auth.providers';

class StubAuthService {
  readonly checkStatus = jasmine.createSpy('checkStatus').and.returnValue(of([]));
  readonly login = jasmine.createSpy('login');
  readonly disconnectPlatform = jasmine.createSpy('disconnectPlatform').and.returnValue(of(undefined));
}

describe('ConnectionManagerService', () => {
  let service: ConnectionManagerService;
  let auth: StubAuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        providePlatformAuthServices(),
        { provide: AuthService, useClass: StubAuthService },
      ],
    });
    service = TestBed.inject(ConnectionManagerService);
    auth = TestBed.inject(AuthService) as unknown as StubAuthService;
  });

  it('expone ambas plataformas', () => {
    expect(service.platforms).toEqual(['spotify', 'youtube-music']);
  });

  it('empieza desconectado', () => {
    expect(service.states().spotify.status).toBe('disconnected');
    expect(service.states()['youtube-music'].status).toBe('disconnected');
    expect(service.connectedCount()).toBe(0);
    expect(service.allConnected()).toBe(false);
  });

  it('conecta una plataforma marcando connecting y redirige al login', () => {
    void service.connectTo('spotify');

    expect(service.states().spotify.status).toBe('connecting');
    expect(auth.login).toHaveBeenCalledWith('spotify');
  });

  it('refresca el estado con las plataformas conectadas en el backend', async () => {
    auth.checkStatus.and.returnValue(of(['spotify', 'youtube-music']));

    await service.refresh();

    expect(service.states().spotify.status).toBe('connected');
    expect(service.states()['youtube-music'].status).toBe('connected');
    expect(service.connectedCount()).toBe(2);
    expect(service.allConnected()).toBe(true);
  });

  it('desconecta una plataforma vía la API y la devuelve a disconnected', async () => {
    await service.disconnectFrom('spotify');

    expect(auth.disconnectPlatform).toHaveBeenCalledWith('spotify');
    expect(service.states().spotify.status).toBe('disconnected');
    expect(service.connectedCount()).toBe(0);
  });
});
