import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  GuardResult,
  MaybeAsync,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';

import { ConnectionManagerService } from '../services/connection-manager.service';
import { providePlatformAuthServices } from '../services/platform-auth.providers';
import { requireConnectionsGuard } from './require-connections.guard';

describe('requireConnectionsGuard', () => {
  function runGuard(): MaybeAsync<GuardResult> {
    return TestBed.runInInjectionContext(() =>
      requireConnectionsGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), providePlatformAuthServices()],
    });
  });

  it('redirige a /connect cuando no hay plataformas conectadas', () => {
    const result = runGuard();
    expect(result instanceof UrlTree).toBe(true);
    expect((result as UrlTree).toString()).toBe('/connect');
  });

  it('permite el acceso cuando ambas plataformas están conectadas', fakeAsync(() => {
    const manager = TestBed.inject(ConnectionManagerService);
    void manager.connectTo('spotify');
    void manager.connectTo('youtube-music');
    tick(5000);

    expect(runGuard()).toBe(true);
  }));
});
