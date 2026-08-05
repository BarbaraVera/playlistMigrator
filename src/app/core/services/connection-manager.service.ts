import { computed, inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ConnectionState } from '../models/connection';
import { PlatformId } from '../models/platform';
import { AuthService } from './auth.service';
import { PLATFORM_AUTH_SERVICES } from './platform-auth.providers';

@Injectable({ providedIn: 'root' })
export class ConnectionManagerService {
  private readonly authService = inject(AuthService);
  private readonly services = inject(PLATFORM_AUTH_SERVICES);

  readonly platforms: readonly PlatformId[] = this.services.map((service) => service.platform);

  readonly states = computed<Record<PlatformId, ConnectionState>>(() => {
    const result = {} as Record<PlatformId, ConnectionState>;
    for (const service of this.services) {
      result[service.platform] = service.state();
    }
    return result;
  });

  readonly connectedCount = computed(() => {
    return this.platforms.filter((platform) => this.states()[platform].status === 'connected')
      .length;
  });

  readonly allConnected = computed(() => this.connectedCount() === this.platforms.length);

  async refresh(): Promise<void> {
    try {
      const connected = await firstValueFrom(this.authService.checkStatus());
      const connectedSet = new Set(connected);
      for (const service of this.services) {
        service.refresh(connectedSet.has(service.platform));
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'No se pudo consultar el estado de conexión';
      console.warn(message);
    }
  }

  async connectTo(platform: PlatformId): Promise<void> {
    const service = this.services.find((candidate) => candidate.platform === platform);
    if (service) {
      await service.connect();
    }
  }

  async disconnectFrom(platform: PlatformId): Promise<void> {
    const service = this.services.find((candidate) => candidate.platform === platform);
    if (!service) {
      return;
    }
    await service.disconnect();
    await this.refresh();
  }
}
