import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  GuardResult,
  MaybeAsync,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { of } from 'rxjs';

import { AuthService } from '../services/auth.service';
import { ConnectionManagerService } from '../services/connection-manager.service';
import { providePlatformAuthServices } from '../services/platform-auth.providers';
import { requireConnectionsGuard } from './require-connections.guard';

class StubAuthService {
  readonly checkStatus = jasmine.createSpy('checkStatus').and.returnValue(of([]));
  readonly login = jasmine.createSpy('login');
}

describe('requireConnectionsGuard', () => {
  function runGuard(): MaybeAsync<GuardResult> {
    return TestBed.runInInjectionContext(() =>
      requireConnectionsGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        providePlatformAuthServices(),
        { provide: AuthService, useClass: StubAuthService },
      ],
    });
  });

  it('redirige a /connect cuando no hay plataformas conectadas', () => {
    const result = runGuard();
    expect(result instanceof UrlTree).toBe(true);
    expect((result as UrlTree).toString()).toBe('/connect');
  });

  it('permite el acceso cuando ambas plataformas están conectadas', async () => {
    const manager = TestBed.inject(ConnectionManagerService);
    const auth = TestBed.inject(AuthService) as unknown as StubAuthService;
    auth.checkStatus.and.returnValue(of(['spotify', 'youtube-music']));

    await manager.refresh();

    expect(runGuard()).toBe(true);
  });
});
