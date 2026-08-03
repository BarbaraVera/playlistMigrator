import { fakeAsync, TestBed, tick } from '@angular/core/testing';

import { ConnectionManagerService } from './connection-manager.service';
import { providePlatformAuthServices } from './platform-auth.providers';

describe('ConnectionManagerService', () => {
  let service: ConnectionManagerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [providePlatformAuthServices()],
    });
    service = TestBed.inject(ConnectionManagerService);
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

  it('conecta una plataforma y actualiza el estado', fakeAsync(() => {
    let settled = false;
    void service.connectTo('spotify').then(() => {
      settled = true;
    });

    expect(service.states().spotify.status).toBe('connecting');
    expect(service.connectedCount()).toBe(0);

    tick(5000);

    expect(settled).toBe(true);
    expect(service.states().spotify.status).toBe('connected');
    expect(service.states().spotify.profile?.displayName).toBeTruthy();
    expect(service.connectedCount()).toBe(1);
    expect(service.allConnected()).toBe(false);
  }));

  it('allConnected se cumple cuando ambas plataformas están conectadas', fakeAsync(() => {
    void service.connectTo('spotify');
    void service.connectTo('youtube-music');

    tick(5000);

    expect(service.connectedCount()).toBe(2);
    expect(service.allConnected()).toBe(true);
  }));

  it('desconecta una plataforma y la devuelve a disconnected', fakeAsync(() => {
    void service.connectTo('spotify');
    tick(5000);

    service.disconnectFrom('spotify');

    expect(service.states().spotify.status).toBe('disconnected');
    expect(service.connectedCount()).toBe(0);
  }));
});
