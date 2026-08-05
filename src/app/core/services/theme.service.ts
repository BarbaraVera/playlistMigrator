import { Injectable, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'playlist-migrator:theme';
const DARK_QUERY = '(prefers-color-scheme: dark)';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly mediaQuery = window.matchMedia(DARK_QUERY);
  private readonly isDarkSignal = signal<boolean>(false);

  private explicitMode: ThemeMode | null = null;

  readonly isDark = this.isDarkSignal.asReadonly();

  constructor() {
    this.explicitMode = this.readStoredMode();
    this.apply(this.resolveInitial());
    if (this.explicitMode === null) {
      this.mediaQuery.addEventListener('change', this.onSystemChange);
    }
  }

  toggle(): void {
    this.setExplicit(this.isDarkSignal() ? 'light' : 'dark');
  }

  private setExplicit(mode: ThemeMode): void {
    this.explicitMode = mode;
    this.mediaQuery.removeEventListener('change', this.onSystemChange);
    this.persist(mode);
    this.apply(mode === 'dark');
  }

  private resolveInitial(): boolean {
    if (this.explicitMode !== null) {
      return this.explicitMode === 'dark';
    }
    return this.mediaQuery.matches;
  }

  private readonly onSystemChange = (event: MediaQueryListEvent): void => {
    if (this.explicitMode === null) {
      this.apply(event.matches);
    }
  };

  private apply(dark: boolean): void {
    this.isDarkSignal.set(dark);
    document.documentElement.classList.toggle('dark', dark);
  }

  private readStoredMode(): ThemeMode | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored === 'dark' || stored === 'light' ? stored : null;
    } catch {
      return null;
    }
  }

  private persist(mode: ThemeMode): void {
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      /* sin almacenamiento disponible: el tema solo aplica durante la sesión */
    }
  }
}
