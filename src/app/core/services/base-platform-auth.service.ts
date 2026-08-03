import { Injectable, signal } from '@angular/core';

import { CONNECTION_DISCONNECTED, ConnectionState } from '../models/connection';
import { PlatformId } from '../models/platform';
import { PlatformProfile } from '../models/platform';
import { PlatformAuthService } from './platform-auth.service';

@Injectable()
export abstract class BasePlatformAuthService implements PlatformAuthService {
  abstract readonly platform: PlatformId;
  protected abstract readonly delayMs: number;
  protected abstract authenticate(): Promise<PlatformProfile>;

  private readonly stateSignal = signal<ConnectionState>(CONNECTION_DISCONNECTED);

  readonly state = this.stateSignal.asReadonly();

  async connect(): Promise<ConnectionState> {
    const current = this.stateSignal();
    if (current.status === 'connecting' || current.status === 'connected') {
      return current;
    }

    this.stateSignal.set({ status: 'connecting' });

    try {
      await delay(this.delayMs);
      const profile = await this.authenticate();
      const connected: ConnectionState = { status: 'connected', profile };
      this.stateSignal.set(connected);
      return connected;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      this.stateSignal.set({ status: 'error', error: message });
      return this.stateSignal();
    }
  }

  disconnect(): void {
    this.stateSignal.set(CONNECTION_DISCONNECTED);
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
