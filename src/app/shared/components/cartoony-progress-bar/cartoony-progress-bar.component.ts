import { NgClass } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { LucideCheck, LucideTriangleAlert } from '@lucide/angular';

export type CartoonyProgressStatus = 'idle' | 'running' | 'success' | 'error';
export type CartoonyProgressSize = 'sm' | 'md' | 'lg';

const FILL_CLASSES: Record<CartoonyProgressStatus, string> = {
  idle: 'bg-ink/15',
  running: 'bg-sun progress-stripes animate-stripes',
  success: 'bg-grass',
  error: 'bg-berry',
};

const TRACK_HEIGHT_CLASSES: Record<CartoonyProgressSize, string> = {
  sm: 'h-4',
  md: 'h-5',
  lg: 'h-7',
};

@Component({
  selector: 'app-cartoony-progress-bar',
  standalone: true,
  templateUrl: './cartoony-progress-bar.component.html',
  styleUrl: './cartoony-progress-bar.component.scss',
  imports: [NgClass, LucideCheck, LucideTriangleAlert],
})
export class CartoonyProgressBarComponent {
  readonly progress = input(0);
  readonly status = input<CartoonyProgressStatus>('idle');
  readonly size = input<CartoonyProgressSize>('md');
  readonly showLabel = input(true);

  protected readonly clamped = computed(() =>
    Math.max(0, Math.min(100, Math.round(this.progress()))),
  );
  protected readonly fillClasses = FILL_CLASSES;
  protected readonly trackHeightClasses = TRACK_HEIGHT_CLASSES;
}
