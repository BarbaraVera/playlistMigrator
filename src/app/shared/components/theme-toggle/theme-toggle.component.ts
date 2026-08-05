import { Component, inject } from '@angular/core';
import { LucideMoon, LucideSun } from '@lucide/angular';

import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  templateUrl: './theme-toggle.component.html',
  styleUrl: './theme-toggle.component.scss',
  imports: [LucideMoon, LucideSun],
})
export class ThemeToggleComponent {
  private readonly theme = inject(ThemeService);

  protected readonly isDark = this.theme.isDark;

  protected toggle(): void {
    this.theme.toggle();
  }
}
