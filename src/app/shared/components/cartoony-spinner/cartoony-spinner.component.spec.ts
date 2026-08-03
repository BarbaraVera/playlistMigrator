import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { CartoonySpinnerComponent } from './cartoony-spinner.component';

describe('CartoonySpinnerComponent', () => {
  let fixture: ComponentFixture<CartoonySpinnerComponent>;
  let component: CartoonySpinnerComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CartoonySpinnerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CartoonySpinnerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('crea el componente', () => {
    expect(component).toBeTruthy();
  });

  it('expone el rol de status', () => {
    const spinner = fixture.debugElement.query(By.css('[role="status"]')).nativeElement;
    expect(spinner).toBeTruthy();
  });

  it('aplica el tamaño large', () => {
    fixture.componentRef.setInput('size', 'lg');
    fixture.detectChanges();

    const spinner = fixture.debugElement.query(By.css('[role="status"]')).nativeElement;
    expect(spinner.classList).toContain('h-16');
  });

  it('muestra la etiqueta cuando se provee', () => {
    fixture.componentRef.setInput('label', 'Migrando');
    fixture.detectChanges();

    const text = fixture.debugElement.query(By.css('.font-display')).nativeElement;
    expect(text.textContent).toContain('Migrando');
  });
});
