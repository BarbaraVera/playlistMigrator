import { TestBed } from '@angular/core/testing';

import { ThemeService } from './theme.service';

const STORAGE_KEY = 'playlist-migrator:theme';

type ThemeListener = (event: { matches: boolean }) => void;

class FakeMediaQueryList {
  matches = false;
  private readonly listeners: ThemeListener[] = [];

  addEventListener(_type: string, listener: ThemeListener): void {
    this.listeners.push(listener);
  }

  removeEventListener(_type: string, listener: ThemeListener): void {
    const index = this.listeners.indexOf(listener);
    if (index >= 0) {
      this.listeners.splice(index, 1);
    }
  }

  dispatch(matches: boolean): void {
    this.matches = matches;
    for (const listener of [...this.listeners]) {
      listener({ matches });
    }
  }
}

describe('ThemeService', () => {
  let media: FakeMediaQueryList;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    media = new FakeMediaQueryList();
    spyOn(window, 'matchMedia').and.returnValue(media as unknown as MediaQueryList);
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('usa el tema del sistema por defecto', () => {
    media.matches = true;
    const service = TestBed.inject(ThemeService);
    expect(service.isDark()).toBeTrue();
    expect(document.documentElement.classList.contains('dark')).toBeTrue();
  });

  it('arranca en claro si el sistema es claro', () => {
    media.matches = false;
    const service = TestBed.inject(ThemeService);
    expect(service.isDark()).toBeFalse();
    expect(document.documentElement.classList.contains('dark')).toBeFalse();
  });

  it('alterna el tema y lo persiste', () => {
    media.matches = false;
    const service = TestBed.inject(ThemeService);
    expect(service.isDark()).toBeFalse();

    service.toggle();
    expect(service.isDark()).toBeTrue();
    expect(document.documentElement.classList.contains('dark')).toBeTrue();
    expect(localStorage.getItem(STORAGE_KEY)).toBe('dark');

    service.toggle();
    expect(service.isDark()).toBeFalse();
    expect(localStorage.getItem(STORAGE_KEY)).toBe('light');
  });

  it('respeta la preferencia guardada', () => {
    localStorage.setItem(STORAGE_KEY, 'dark');
    media.matches = false;
    const service = TestBed.inject(ThemeService);
    expect(service.isDark()).toBeTrue();
    expect(document.documentElement.classList.contains('dark')).toBeTrue();
  });

  it('sigue los cambios del sistema hasta que el usuario elige', () => {
    media.matches = false;
    const service = TestBed.inject(ThemeService);
    expect(service.isDark()).toBeFalse();

    media.dispatch(true);
    expect(service.isDark()).toBeTrue();

    service.toggle();
    expect(service.isDark()).toBeFalse();

    media.dispatch(true);
    expect(service.isDark()).toBeFalse();
  });
});
