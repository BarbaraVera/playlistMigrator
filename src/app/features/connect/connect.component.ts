import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { LucideArrowRight, LucideDisc3, LucideHeadphones, LucideMusic } from '@lucide/angular';

import { ConnectionManagerService } from '../../core/services/connection-manager.service';
import { ConnectionState, ConnectionStatus } from '../../core/models/connection';
import { PlatformId } from '../../core/models/platform';
import {
  CartoonyBadgeComponent,
  CartoonyBadgeStatus,
} from '../../shared/components/cartoony-badge/cartoony-badge.component';
import { CartoonyButtonComponent } from '../../shared/components/cartoony-button/cartoony-button.component';
import { CartoonyCardComponent } from '../../shared/components/cartoony-card/cartoony-card.component';
import { SpotifyLogoComponent } from './spotify-logo.component';
import { YoutubeMusicLogoComponent } from './youtube-music-logo.component';

interface PlatformCardConfig {
  id: PlatformId;
  name: string;
  description: string;
  brandClass: string;
}

const PLATFORM_CARDS: readonly PlatformCardConfig[] = [
  {
    id: 'spotify',
    name: 'Spotify',
    description: 'Conecta tu cuenta para leer tus playlists de origen.',
    brandClass: 'text-[#1DB954]',
  },
  {
    id: 'youtube-music',
    name: 'YouTube Music',
    description: 'Conecta tu cuenta para crear tus playlists de destino.',
    brandClass: 'text-[#FF0000]',
  },
];

const STATUS_LABELS: Record<ConnectionStatus, string> = {
  disconnected: 'Desconectado',
  connecting: 'Conectando…',
  connected: 'Conectado',
  error: 'Error',
};

const ACTION_LABELS: Record<ConnectionStatus, string> = {
  disconnected: 'Conectar',
  connecting: 'Conectando…',
  connected: 'Desconectar',
  error: 'Reintentar',
};

@Component({
  selector: 'app-connect',
  standalone: true,
  templateUrl: './connect.component.html',
  styleUrl: './connect.component.scss',
  imports: [
    CartoonyBadgeComponent,
    CartoonyButtonComponent,
    CartoonyCardComponent,
    LucideArrowRight,
    LucideDisc3,
    LucideHeadphones,
    LucideMusic,
    SpotifyLogoComponent,
    YoutubeMusicLogoComponent,
  ],
})
export class ConnectComponent {
  private readonly manager = inject(ConnectionManagerService);
  private readonly router = inject(Router);

  protected readonly cards = PLATFORM_CARDS;
  protected readonly states = this.manager.states;
  protected readonly connectedCount = this.manager.connectedCount;
  protected readonly allConnected = this.manager.allConnected;
  protected readonly statusLabels = STATUS_LABELS;
  protected readonly actionLabels = ACTION_LABELS;

  protected readonly spotifyState = computed(() => this.states()['spotify']);
  protected readonly youtubeState = computed(() => this.states()['youtube-music']);

  protected stateOf(platform: PlatformId): ConnectionState {
    return this.states()[platform];
  }

  protected badgeStatus(status: ConnectionStatus): CartoonyBadgeStatus {
    switch (status) {
      case 'connected':
        return 'success';
      case 'connecting':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'neutral';
    }
  }

  protected isConnecting(status: ConnectionStatus): boolean {
    return status === 'connecting';
  }

  protected isConnected(status: ConnectionStatus): boolean {
    return status === 'connected';
  }

  protected onAction(platform: PlatformId): void {
    const state = this.states()[platform];
    if (state.status === 'connected') {
      this.manager.disconnectFrom(platform);
    } else if (state.status !== 'connecting') {
      void this.manager.connectTo(platform);
    }
  }

  protected goToPlaylistSelection(): void {
    void this.router.navigate(['/playlist-selection']);
  }
}
