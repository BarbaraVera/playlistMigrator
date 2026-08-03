import { NgClass } from '@angular/common';
import { Component, computed, input } from '@angular/core';

export type CartoonyCardVariant = 'default' | 'pop' | 'accent';

const VARIANT_CLASSES: Record<CartoonyCardVariant, string> = {
  default: 'bg-white',
  pop: 'bg-sun',
  accent: 'bg-sky',
};

@Component({
  selector: 'app-cartoony-card',
  standalone: true,
  templateUrl: './cartoony-card.component.html',
  styleUrl: './cartoony-card.component.scss',
  imports: [NgClass],
})
export class CartoonyCardComponent {
  readonly title = input('');
  readonly variant = input<CartoonyCardVariant>('default');
  readonly elevated = input(false);
  readonly hoverable = input(false);
  readonly bounceIn = input(false);

  protected readonly classes = computed(() => {
    const parts = ['border-4 border-ink rounded-2xl', VARIANT_CLASSES[this.variant()]];

    if (this.elevated()) {
      parts.push('shadow-game-lg');
    } else {
      parts.push('shadow-game-sm');
    }

    if (this.hoverable()) {
      parts.push('transition-transform duration-150 hover:-translate-y-1 hover:shadow-game-md');
    }

    if (this.bounceIn()) {
      parts.push('animate-bounce-in');
    }

    return parts.join(' ');
  });
}
