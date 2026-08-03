import { PlatformId } from './platform';

export interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  durationMs?: number;
}

export interface Playlist {
  id: string;
  title: string;
  coverUrl: string;
  trackCount: number;
  owner: string;
  platform: PlatformId;
  description?: string;
  tracks?: readonly Track[];
}

export type PlaylistLoadStatus = 'idle' | 'loading' | 'loaded' | 'error';

export interface PlaylistLoadState {
  status: PlaylistLoadStatus;
  count?: number;
  error?: string;
}

export const PLAYLIST_LOAD_IDLE: PlaylistLoadState = Object.freeze({ status: 'idle' });
