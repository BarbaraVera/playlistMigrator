import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { ThemeService } from '../../../core/services/theme.service';
import { ThemeToggleComponent } from './theme-toggle.component';

describe('ThemeToggleComponent', () => {
  let fixture: ComponentFixture<ThemeToggleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThemeToggleComponent],
    }).compileComponents();
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  function render(): void {
    fixture = TestBed.createComponent(ThemeToggleComponent);
    fixture.detectChanges();
  }

  it('crea el componente', () => {
    render();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('muestra la luna en modo claro', () => {
    localStorage.setItem('playlist-migrator:theme', 'light');
    render();
    expect(fixture.debugElement.query(By.css('svg[lucideMoon]'))).toBeTruthy();
    expect(fixture.debugElement.query(By.css('svg[lucideSun]'))).toBeNull();
  });

  it('muestra el sol en modo nocturno', () => {
    localStorage.setItem('playlist-migrator:theme', 'dark');
    render();
    expect(fixture.debugElement.query(By.css('svg[lucideSun]'))).toBeTruthy();
    expect(fixture.debugElement.query(By.css('svg[lucideMoon]'))).toBeNull();
  });

  it('alterna el tema al pulsarlo', () => {
    localStorage.setItem('playlist-migrator:theme', 'light');
    render();

    const theme = TestBed.inject(ThemeService);
    expect(theme.isDark()).toBeFalse();

    const button = fixture.debugElement.query(By.css('[data-test="theme-toggle"]'))
      .nativeElement as HTMLButtonElement;
    button.click();
    fixture.detectChanges();

    expect(theme.isDark()).toBeTrue();
    expect(fixture.debugElement.query(By.css('svg[lucideSun]'))).toBeTruthy();
  });
});
