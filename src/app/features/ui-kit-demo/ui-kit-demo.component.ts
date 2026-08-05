import { Component, computed, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';
import { take } from 'rxjs/operators';
import {
  LucideArrowRight,
  LucideCheck,
  LucideDisc3,
  LucideGamepad2,
  LucideListMusic,
  LucideMusic2,
  LucidePartyPopper,
  LucidePlay,
  LucideSparkles,
  LucideStar,
  LucideWand,
} from '@lucide/angular';

import { BackHomeComponent } from '../../shared/components/back-home/back-home.component';
import { CartoonyBadgeComponent } from '../../shared/components/cartoony-badge/cartoony-badge.component';
import { CartoonyButtonComponent } from '../../shared/components/cartoony-button/cartoony-button.component';
import { CartoonyCardComponent } from '../../shared/components/cartoony-card/cartoony-card.component';
import { CartoonyModalComponent } from '../../shared/components/cartoony-modal/cartoony-modal.component';
import { CartoonyProgressBarComponent } from '../../shared/components/cartoony-progress-bar/cartoony-progress-bar.component';
import { CartoonySpinnerComponent } from '../../shared/components/cartoony-spinner/cartoony-spinner.component';
import type { CartoonyProgressStatus } from '../../shared/components/cartoony-progress-bar/cartoony-progress-bar.component';

@Component({
  selector: 'app-ui-kit-demo',
  standalone: true,
  templateUrl: './ui-kit-demo.component.html',
  styleUrl: './ui-kit-demo.component.scss',
  imports: [
    BackHomeComponent,
    CartoonyButtonComponent,
    CartoonyCardComponent,
    CartoonyBadgeComponent,
    CartoonyProgressBarComponent,
    CartoonySpinnerComponent,
    CartoonyModalComponent,
    LucideArrowRight,
    LucideCheck,
    LucideDisc3,
    LucideGamepad2,
    LucideListMusic,
    LucideMusic2,
    LucidePartyPopper,
    LucidePlay,
    LucideSparkles,
    LucideStar,
    LucideWand,
  ],
})
export class UiKitDemoComponent {
  protected readonly progress = signal(0);
  protected readonly running = signal(false);
  protected readonly modalOpen = signal(false);

  protected readonly progressStatus = computed<CartoonyProgressStatus>(() => {
    if (this.running()) {
      return 'running';
    }
    return this.progress() >= 100 ? 'success' : 'idle';
  });

  protected startMigration(): void {
    if (this.running()) {
      return;
    }

    this.running.set(true);
    this.progress.set(0);

    interval(90)
      .pipe(take(101), takeUntilDestroyed())
      .subscribe({
        next: (value) => this.progress.set(value),
        complete: () => this.running.set(false),
      });
  }

  protected toggleModal(): void {
    this.modalOpen.update((value) => !value);
  }
}
