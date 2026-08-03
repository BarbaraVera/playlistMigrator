export type PlatformId = 'spotify' | 'youtube-music';

export interface PlatformProfile {
  id: string;
  displayName: string;
  email?: string;
  imageUrl?: string;
}
