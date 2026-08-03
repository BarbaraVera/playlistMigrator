import { Injectable } from '@angular/core';

import { Playlist } from '../models/playlist';

function coverSvg(from: string, to: string, emoji: string): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/>` +
    `</linearGradient></defs>` +
    `<rect width="160" height="160" fill="url(#g)"/>` +
    `<text x="80" y="98" font-size="60" text-anchor="middle" dominant-baseline="middle">${emoji}</text>` +
    `</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const MOCK_SPOTIFY_PLAYLISTS: readonly Playlist[] = [
  {
    id: 'pl-rock-clasico',
    title: 'Rock Clásico',
    coverUrl: coverSvg('#ff4d6d', '#ff8f3f', '🎸'),
    trackCount: 42,
    owner: 'Camaleón Musical',
    platform: 'spotify',
    description: 'Los himnos del rock que nunca mueren.',
  },
  {
    id: 'pl-gym-power',
    title: 'Gym Power',
    coverUrl: coverSvg('#4cc9f0', '#4361ee', '💪'),
    trackCount: 35,
    owner: 'Camaleón Musical',
    platform: 'spotify',
    description: 'Energía pura para tus series.',
  },
  {
    id: 'pl-chill-tarde',
    title: 'Chill de Tarde',
    coverUrl: coverSvg('#ffc93c', '#ff8f3f', '🌇'),
    trackCount: 28,
    owner: 'Melómano Playlists',
    platform: 'spotify',
    description: 'Temperatura ambiente para el atardecer.',
  },
  {
    id: 'pl-roadtrip-2026',
    title: 'Roadtrip 2026',
    coverUrl: coverSvg('#35c99e', '#4361ee', '🚗'),
    trackCount: 51,
    owner: 'Melómano Playlists',
    platform: 'spotify',
    description: 'Para la ruta, la ventanilla y el volumen alto.',
  },
  {
    id: 'pl-fiesta-latina',
    title: 'Fiesta Latina',
    coverUrl: coverSvg('#ff4d6d', '#ffc93c', '🎉'),
    trackCount: 47,
    owner: 'DJ Chispa',
    platform: 'spotify',
    description: 'Ritmo que no deja a nadie sentado.',
  },
  {
    id: 'pl-lofi-programar',
    title: 'Lo-fi para Programar',
    coverUrl: coverSvg('#141414', '#4cc9f0', '🧋'),
    trackCount: 64,
    owner: 'Byte & Beat',
    platform: 'spotify',
    description: 'Focus mode activado.',
  },
  {
    id: 'pl-nostalgia-2000',
    title: 'Nostalgia 2000',
    coverUrl: coverSvg('#ff8f3f', '#ff4d6d', '📼'),
    trackCount: 33,
    owner: 'DJ Chispa',
    platform: 'spotify',
    description: 'Ponte los audífonos con cable y revive el 2000.',
  },
  {
    id: 'pl-duermete-bebe',
    title: 'Dúrmete, Bebé',
    coverUrl: coverSvg('#4361ee', '#141414', '🌙'),
    trackCount: 19,
    owner: 'Camaleón Musical',
    platform: 'spotify',
    description: 'Canciones de cuna con un toque retro.',
  },
];

@Injectable({ providedIn: 'root' })
export class SpotifyPlaylistService {
  private readonly delayMs = 900;

  async list(): Promise<readonly Playlist[]> {
    await delay(this.delayMs);
    return MOCK_SPOTIFY_PLAYLISTS;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
