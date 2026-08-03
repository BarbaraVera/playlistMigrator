import { NgClass } from '@angular/common';
import { Component, input } from '@angular/core';

export type CartoonyBadgeStatus = 'success' | 'warning' | 'error' | 'info' | 'neutral';

const STATUS_CLASSES: Record<CartoonyBadgeStatus, string> = {
  success: 'bg-grass',
  warning: 'bg-tangerine',
  error: 'bg-berry',
  info: 'bg-sky',
  neutral: 'bg-white',
};

const STATUS_COLORS: Record<CartoonyBadgeStatus, string> = {
  success: 'var(--color-grass)',
  warning: 'var(--color-tangerine)',
  error: 'var(--color-berry)',
  info: 'var(--color-sky)',
  neutral: 'var(--color-cream)',
};

@Component({
  selector: 'app-cartoony-badge',
  standalone: true,
  templateUrl: './cartoony-badge.component.html',
  styleUrl: './cartoony-badge.component.scss',
  imports: [NgClass],
})
export class CartoonyBadgeComponent {
  readonly status = input<CartoonyBadgeStatus>('neutral');
  readonly pulse = input(false);

  protected readonly statusClasses = STATUS_CLASSES;
  protected readonly statusColors = STATUS_COLORS;
}
