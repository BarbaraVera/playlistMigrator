import { fakeAsync, TestBed, tick } from '@angular/core/testing';

import { YoutubeMusicAuthService } from './youtube-music-auth.service';

describe('YoutubeMusicAuthService', () => {
  let service: YoutubeMusicAuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(YoutubeMusicAuthService);
  });

  it('expone la plataforma youtube-music', () => {
    expect(service.platform).toBe('youtube-music');
  });

  it('pasa por connecting y termina connected', fakeAsync(() => {
    void service.connect();

    expect(service.state().status).toBe('connecting');

    tick(5000);

    expect(service.state().status).toBe('connected');
    expect(service.state().profile?.displayName).toBeTruthy();
  }));

  it('desconecta y limpia el perfil', fakeAsync(() => {
    void service.connect();
    tick(5000);

    service.disconnect();

    expect(service.state().status).toBe('disconnected');
    expect(service.state().profile).toBeUndefined();
  }));
});
