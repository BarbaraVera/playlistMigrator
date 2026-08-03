import { NgClass } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { LucideLoaderCircle } from '@lucide/angular';

export type CartoonyButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'neutral';
export type CartoonyButtonSize = 'sm' | 'md' | 'lg';

const VARIANT_CLASSES: Record<CartoonyButtonVariant, string> = {
  primary: 'bg-sun text-ink hover:brightness-105',
  secondary: 'bg-sky text-ink hover:brightness-105',
  success: 'bg-grass text-ink hover:brightness-105',
  danger: 'bg-berry text-ink hover:brightness-105',
  neutral: 'bg-white text-ink hover:bg-cream/70',
};

const SIZE_CLASSES: Record<CartoonyButtonSize, string> = {
  sm: 'px-4 py-1.5 text-sm rounded-xl shadow-game-xs active:translate-y-[3px]',
  md: 'px-6 py-2.5 text-lg rounded-2xl shadow-game-sm active:translate-y-[5px]',
  lg: 'px-8 py-3.5 text-2xl rounded-2xl shadow-game-md active:translate-y-[7px]',
};

@Component({
  selector: 'app-cartoony-button',
  standalone: true,
  templateUrl: './cartoony-button.component.html',
  styleUrl: './cartoony-button.component.scss',
  imports: [NgClass, LucideLoaderCircle],
  host: {
    '[class.w-full]': 'fullWidth()',
  },
})
export class CartoonyButtonComponent {
  readonly variant = input<CartoonyButtonVariant>('primary');
  readonly size = input<CartoonyButtonSize>('md');
  readonly disabled = input(false);
  readonly loading = input(false);
  readonly type = input<'button' | 'submit'>('button');
  readonly fullWidth = input(false);

  readonly clicked = output<void>();

  protected readonly variantClass = computed(() => VARIANT_CLASSES[this.variant()]);
  protected readonly sizeClass = computed(() => SIZE_CLASSES[this.size()]);
  protected readonly iconSize = computed(() => (this.size() === 'sm' ? 16 : this.size() === 'lg' ? 26 : 20));

  protected handleClick(): void {
    if (!this.disabled() && !this.loading()) {
      this.clicked.emit();
    }
  }
}
