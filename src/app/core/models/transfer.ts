export type TransferStatus = 'idle' | 'in_progress' | 'completed' | 'failed' | 'cancelled';

export type ItemTransferResult = 'success' | 'not_found' | 'skipped';

export interface ItemTransferProgress {
  playlistId: string;
  trackId: string;
  trackTitle: string;
  result: ItemTransferResult;
}

export type PlaylistRunStatus = 'pending' | 'running' | 'done';

export interface PlaylistRun {
  playlistId: string;
  title: string;
  coverUrl: string;
  totalTracks: number;
  processedTracks: number;
  successCount: number;
  warningCount: number;
  status: PlaylistRunStatus;
}

export interface TransferSummary {
  totalPlaylists: number;
  processedTracks: number;
  successfulTracks: number;
  failedTracks: number;
  elapsedMs: number;
}

export interface TransferLogEntry {
  time: number;
  trackId: string;
  playlistTitle: string;
  trackTitle: string;
  result: ItemTransferResult;
}

export const EMPTY_TRANSFER_SUMMARY: TransferSummary = Object.freeze({
  totalPlaylists: 0,
  processedTracks: 0,
  successfulTracks: 0,
  failedTracks: 0,
  elapsedMs: 0,
});
