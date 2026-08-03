import { computed, inject, Injectable } from '@angular/core';

import { ConnectionState } from '../models/connection';
import { PlatformId } from '../models/platform';
import { PLATFORM_AUTH_SERVICES } from './platform-auth.providers';

@Injectable({ providedIn: 'root' })
export class ConnectionManagerService {
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

  async connectTo(platform: PlatformId): Promise<void> {
    const service = this.services.find((candidate) => candidate.platform === platform);
    if (service) {
      await service.connect();
    }
  }

  disconnectFrom(platform: PlatformId): void {
    const service = this.services.find((candidate) => candidate.platform === platform);
    service?.disconnect();
  }
}
