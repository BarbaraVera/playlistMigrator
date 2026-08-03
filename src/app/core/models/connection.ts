import { PlatformProfile } from './platform';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface ConnectionState {
  status: ConnectionStatus;
  profile?: PlatformProfile;
  error?: string;
}

export const CONNECTION_DISCONNECTED: ConnectionState = Object.freeze({
  status: 'disconnected',
});
