import { NgClass } from '@angular/common';
import {
  Component,
  DOCUMENT,
  HostListener,
  OnDestroy,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import { LucideX } from '@lucide/angular';

export type CartoonyModalWidth = 'sm' | 'md' | 'lg';

const WIDTH_CLASSES: Record<CartoonyModalWidth, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
};

@Component({
  selector: 'app-cartoony-modal',
  standalone: true,
  templateUrl: './cartoony-modal.component.html',
  styleUrl: './cartoony-modal.component.scss',
  imports: [NgClass, LucideX],
})
export class CartoonyModalComponent implements OnDestroy {
  readonly open = input(false);
  readonly title = input('');
  readonly closable = input(true);
  readonly width = input<CartoonyModalWidth>('md');

  readonly closed = output<void>();

  protected readonly widthClasses = WIDTH_CLASSES;

  private readonly documentRef = inject(DOCUMENT);

  private readonly lockBodyScroll = effect(() => {
    this.documentRef.body.style.overflow = this.open() ? 'hidden' : '';
  });

  ngOnDestroy(): void {
    this.documentRef.body.style.overflow = '';
  }

  @HostListener('document:keydown', ['$event'])
  protected onDocumentKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.open() && this.closable()) {
      this.close();
    }
  }

  protected close(): void {
    if (this.closable()) {
      this.closed.emit();
    }
  }

  protected onBackdropClick(): void {
    this.close();
  }
}
