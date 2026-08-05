import { NgClass } from '@angular/common';
import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideArrowRight, LucideDisc3, LucideHeadphones, LucideMusic, LucideX } from '@lucide/angular';

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

interface ToastMessage {
  type: 'success' | 'error';
  title: string;
  detail?: string;
}

const TOAST_DURATION_MS = 5000;

const BACKEND_PLATFORM_NAMES: Record<string, string> = {
  spotify: 'Spotify',
  youtube: 'YouTube Music',
};

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
    LucideX,
    NgClass,
    SpotifyLogoComponent,
    YoutubeMusicLogoComponent,
  ],
})
export class ConnectComponent implements OnInit, OnDestroy {
  private readonly manager = inject(ConnectionManagerService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly cards = PLATFORM_CARDS;
  protected readonly states = this.manager.states;
  protected readonly connectedCount = this.manager.connectedCount;
  protected readonly allConnected = this.manager.allConnected;
  protected readonly statusLabels = STATUS_LABELS;
  protected readonly actionLabels = ACTION_LABELS;
  protected readonly toast = signal<ToastMessage | null>(null);

  protected readonly spotifyState = computed(() => this.states()['spotify']);
  protected readonly youtubeState = computed(() => this.states()['youtube-music']);

  private dismissTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.processCallbackParams();
    void this.manager.refresh();
  }

  ngOnDestroy(): void {
    this.clearDismissTimer();
  }

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
      void this.manager.disconnectFrom(platform);
    } else if (state.status !== 'connecting') {
      void this.manager.connectTo(platform);
    }
  }

  protected dismissToast(): void {
    this.clearDismissTimer();
    this.toast.set(null);
  }

  protected goToPlaylistSelection(): void {
    void this.router.navigate(['/playlist-selection']);
  }

  private processCallbackParams(): void {
    const params = this.route.snapshot.queryParamMap;
    const status = params.get('status');
    if (status === null) {
      return;
    }

    const platform = params.get('platform') ?? '';
    const name = BACKEND_PLATFORM_NAMES[platform] ?? platform;

    if (status === 'success') {
      this.showToast({ type: 'success', title: `¡${name} conectado!` });
    } else if (status === 'error') {
      this.showToast({
        type: 'error',
        title: `No se pudo conectar ${name}`,
        detail: params.get('message') ?? undefined,
      });
    }

    void this.router.navigate([], { queryParams: {}, replaceUrl: true });
  }

  private showToast(toast: ToastMessage): void {
    this.clearDismissTimer();
    this.toast.set(toast);
    this.dismissTimer = setTimeout(() => this.toast.set(null), TOAST_DURATION_MS);
  }

  private clearDismissTimer(): void {
    if (this.dismissTimer !== null) {
      clearTimeout(this.dismissTimer);
      this.dismissTimer = null;
    }
  }
}
