import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { credentialsInterceptor } from '../http/credentials.interceptor';
import { AuthService } from './auth.service';

@Injectable()
class RedirectableAuthService extends AuthService {
  override navigateTo = jasmine.createSpy('navigateTo');
}

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([credentialsInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useClass: RedirectableAuthService },
      ],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('consulta /api/auth/me incluyendo credenciales y mapea las plataformas conectadas', () => {
    let result: string[] | undefined;
    service.checkStatus().subscribe((platforms) => {
      result = platforms;
    });

    const request = http.expectOne(`${service.backendBaseUrl}/api/auth/me`);
    expect(request.request.method).toBe('GET');
    expect(request.request.withCredentials).toBe(true);
    request.flush({ connected_platforms: ['spotify', 'youtube'] });

    expect(result).toEqual(['spotify', 'youtube-music']);
  });

  it('ignora plataformas desconocidas en el estado', () => {
    let result: string[] | undefined;
    service.checkStatus().subscribe((platforms) => {
      result = platforms;
    });

    http
      .expectOne(`${service.backendBaseUrl}/api/auth/me`)
      .flush({ connected_platforms: ['spotify', 'unknown'] });

    expect(result).toEqual(['spotify']);
  });

  it('construye la URL de login de spotify', () => {
    expect(service.buildLoginUrl('spotify')).toBe(
      `${service.backendBaseUrl}/api/auth/spotify/login`,
    );
  });

  it('construye la URL de login de youtube-music', () => {
    expect(service.buildLoginUrl('youtube-music')).toBe(
      `${service.backendBaseUrl}/api/auth/youtube/login`,
    );
  });

  it('desconecta spotify mediante POST con credenciales', () => {
    service.disconnectPlatform('spotify').subscribe();

    const request = http.expectOne(`${service.backendBaseUrl}/api/auth/spotify/disconnect`);
    expect(request.request.method).toBe('POST');
    expect(request.request.withCredentials).toBe(true);
    request.flush({ connected_platforms: [] });
  });

  it('desconecta youtube-music usando el id de ruta youtube', () => {
    service.disconnectPlatform('youtube-music').subscribe();

    const request = http.expectOne(`${service.backendBaseUrl}/api/auth/youtube/disconnect`);
    expect(request.request.method).toBe('POST');
    expect(request.request.withCredentials).toBe(true);
    request.flush({ connected_platforms: ['spotify'] });
  });

  it('redirige la ventana al login de la plataforma', () => {
    const redirectable = service as RedirectableAuthService;
    redirectable.login('spotify');
    expect(redirectable.navigateTo).toHaveBeenCalledWith(
      `${service.backendBaseUrl}/api/auth/spotify/login`,
    );
  });
});
