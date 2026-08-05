import { Signal } from '@angular/core';

import { ConnectionState } from '../models/connection';
import { PlatformId } from '../models/platform';

export interface PlatformAuthService {
  readonly platform: PlatformId;
  readonly state: Signal<ConnectionState>;
  connect(): Promise<ConnectionState>;
  disconnect(): Promise<void>;
  refresh(connected: boolean): void;
}
