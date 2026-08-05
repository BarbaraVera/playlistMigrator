import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { LucideHome } from '@lucide/angular';

import { CartoonyButtonComponent } from '../cartoony-button/cartoony-button.component';

@Component({
  selector: 'app-back-home',
  standalone: true,
  templateUrl: './back-home.component.html',
  styleUrl: './back-home.component.scss',
  imports: [CartoonyButtonComponent, LucideHome],
})
export class BackHomeComponent {
  private readonly router = inject(Router);

  protected goHome(): void {
    void this.router.navigate(['/connect']);
  }
}
