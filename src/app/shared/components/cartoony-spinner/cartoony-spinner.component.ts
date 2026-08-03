import { NgClass } from '@angular/common';
import { Component, input } from '@angular/core';

export type CartoonySpinnerSize = 'sm' | 'md' | 'lg';

const SIZE_CLASSES: Record<CartoonySpinnerSize, string> = {
  sm: 'h-6 w-6',
  md: 'h-10 w-10',
  lg: 'h-16 w-16',
};

@Component({
  selector: 'app-cartoony-spinner',
  standalone: true,
  templateUrl: './cartoony-spinner.component.html',
  styleUrl: './cartoony-spinner.component.scss',
  imports: [NgClass],
})
export class CartoonySpinnerComponent {
  readonly size = input<CartoonySpinnerSize>('md');
  readonly label = input('');

  protected readonly sizeClasses = SIZE_CLASSES;
}
