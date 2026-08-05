import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { CONNECTION_DISCONNECTED, ConnectionState } from '../models/connection';
import { PlatformId } from '../models/platform';
import { AuthService } from './auth.service';
import { PlatformAuthService } from './platform-auth.service';

@Injectable()
export abstract class BasePlatformAuthService implements PlatformAuthService {
  abstract readonly platform: PlatformId;

  private readonly authService = inject(AuthService);
  private readonly stateSignal = signal<ConnectionState>(CONNECTION_DISCONNECTED);

  readonly state = this.stateSignal.asReadonly();

  async connect(): Promise<ConnectionState> {
    const current = this.stateSignal();
    if (current.status === 'connecting' || current.status === 'connected') {
      return current;
    }

    this.stateSignal.set({ status: 'connecting' });
    this.authService.login(this.platform);
    return this.stateSignal();
  }

  async disconnect(): Promise<void> {
    try {
      await firstValueFrom(this.authService.disconnectPlatform(this.platform));
      this.stateSignal.set(CONNECTION_DISCONNECTED);
    } catch {
      this.stateSignal.set({
        status: 'error',
        error: 'No se pudo desconectar la cuenta.',
      });
    }
  }

  refresh(connected: boolean): void {
    this.stateSignal.set(connected ? { status: 'connected' } : CONNECTION_DISCONNECTED);
  }
}
