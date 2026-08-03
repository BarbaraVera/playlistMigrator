import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Component, input } from '@angular/core';

import { CartoonyButtonComponent } from './cartoony-button.component';

@Component({
  standalone: true,
  template: `
    <app-cartoony-button
      [disabled]="disabled()"
      [loading]="loading()"
      [fullWidth]="fullWidth()"
      (clicked)="onClick()"
    >
      Empezar
    </app-cartoony-button>
  `,
  imports: [CartoonyButtonComponent],
})
class HostComponent {
  readonly disabled = input(false);
  readonly loading = input(false);
  readonly fullWidth = input(false);
  clicks = 0;

  onClick(): void {
    this.clicks++;
  }
}

describe('CartoonyButtonComponent', () => {
  let host: HostComponent;
  let hostFixture: ComponentFixture<HostComponent>;
  let buttonEl: HTMLButtonElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();

    hostFixture = TestBed.createComponent(HostComponent);
    host = hostFixture.componentInstance;
    hostFixture.detectChanges();
    buttonEl = hostFixture.debugElement.query(By.css('button')).nativeElement;
  });

  it('crea el componente', () => {
    expect(buttonEl).toBeTruthy();
  });

  it('renderiza la etiqueta proyectada', () => {
    expect(buttonEl.textContent).toContain('Empezar');
  });

  it('usa la variante primaria por defecto', () => {
    expect(buttonEl.classList).toContain('bg-sun');
  });

  it('emite clicked al pulsar', () => {
    buttonEl.click();
    expect(host.clicks).toBe(1);
  });

  it('no emite clicked cuando está deshabilitado', () => {
    hostFixture.componentRef.setInput('disabled', true);
    hostFixture.detectChanges();

    buttonEl.click();
    expect(host.clicks).toBe(0);
  });

  it('deshabilita el botón nativo cuando disabled es true', () => {
    hostFixture.componentRef.setInput('disabled', true);
    hostFixture.detectChanges();
    expect(buttonEl.disabled).toBe(true);
  });

  it('muestra el spinner solo cuando loading es true', () => {
    const spinner = buttonEl.querySelector('[data-test="spinner"]') as HTMLElement;
    expect(spinner.classList).toContain('opacity-0');

    hostFixture.componentRef.setInput('loading', true);
    hostFixture.detectChanges();
    expect(spinner.classList).toContain('opacity-100');
  });

  it('ocupa todo el ancho cuando fullWidth es true', () => {
    hostFixture.componentRef.setInput('fullWidth', true);
    hostFixture.detectChanges();
    expect(buttonEl.classList).toContain('w-full');
  });
});
