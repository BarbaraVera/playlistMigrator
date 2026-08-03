import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { CartoonyProgressBarComponent } from './cartoony-progress-bar.component';

describe('CartoonyProgressBarComponent', () => {
  let fixture: ComponentFixture<CartoonyProgressBarComponent>;
  let component: CartoonyProgressBarComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CartoonyProgressBarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CartoonyProgressBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('crea el componente', () => {
    expect(component).toBeTruthy();
  });

  it('muestra el porcentaje en la etiqueta', () => {
    fixture.componentRef.setInput('progress', 42);
    fixture.detectChanges();

    const label = fixture.debugElement.query(By.css('.tabular-nums')).nativeElement;
    expect(label.textContent).toContain('42%');
  });

  it('clampa valores fuera de rango', () => {
    const fill = fixture.debugElement.query(By.css('[role="progressbar"] > div')).nativeElement;

    fixture.componentRef.setInput('progress', 150);
    fixture.detectChanges();
    expect(fill.style.width).toBe('100%');

    fixture.componentRef.setInput('progress', -5);
    fixture.detectChanges();
    expect(fill.style.width).toBe('0%');
  });

  it('aplica el ancho del relleno según el progreso', () => {
    fixture.componentRef.setInput('progress', 25);
    fixture.detectChanges();

    const fill = fixture.debugElement.query(By.css('[role="progressbar"] > div')).nativeElement;
    expect(fill.style.width).toBe('25%');
  });

  it('aplica el estado running con rayas animadas', () => {
    fixture.componentRef.setInput('status', 'running');
    fixture.detectChanges();

    const fill = fixture.debugElement.query(By.css('[role="progressbar"] > div')).nativeElement;
    expect(fill.classList).toContain('animate-stripes');
  });

  it('muestra el icono de éxito cuando el estado es success', () => {
    fixture.componentRef.setInput('status', 'success');
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('svg'))).toBeTruthy();
  });
});
