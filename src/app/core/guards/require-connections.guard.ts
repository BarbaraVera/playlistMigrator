import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';

import { ConnectionManagerService } from '../services/connection-manager.service';

export const requireConnectionsGuard: CanActivateFn = (): boolean | UrlTree => {
  const manager = inject(ConnectionManagerService);
  const router = inject(Router);

  return manager.allConnected() ? true : router.createUrlTree(['/connect']);
};
