import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { CartoonyModalComponent } from './cartoony-modal.component';

describe('CartoonyModalComponent', () => {
  let fixture: ComponentFixture<CartoonyModalComponent>;
  let component: CartoonyModalComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CartoonyModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CartoonyModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('crea el componente', () => {
    expect(component).toBeTruthy();
  });

  it('no renderiza el diálogo cuando open es false', () => {
    expect(fixture.debugElement.query(By.css('[role="dialog"]'))).toBeNull();
  });

  it('renderiza el diálogo con título cuando open es true', () => {
    fixture.componentRef.setInput('open', true);
    fixture.componentRef.setInput('title', '¡Éxito!');
    fixture.detectChanges();

    const dialog = fixture.debugElement.query(By.css('[role="dialog"]')).nativeElement;
    expect(dialog).toBeTruthy();
    expect(dialog.querySelector('h2')?.textContent).toContain('¡Éxito!');
  });

  it('emite closed al pulsar el botón de cerrar', () => {
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();

    let closed = false;
    component.closed.subscribe(() => (closed = true));

    const closeBtn = fixture.debugElement.query(By.css('button[aria-label="Cerrar"]')).nativeElement;
    closeBtn.click();
    expect(closed).toBe(true);
  });

  it('emite closed al pulsar Escape', () => {
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();

    let closed = false;
    component.closed.subscribe(() => (closed = true));

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(closed).toBe(true);
  });

  it('emite closed al pulsar el backdrop', () => {
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();

    let closed = false;
    component.closed.subscribe(() => (closed = true));

    const backdrop = fixture.debugElement.query(By.css('.bg-outline\\/70')).nativeElement;
    backdrop.click();
    expect(closed).toBe(true);
  });

  it('no emite closed con Escape si closable es false', () => {
    fixture.componentRef.setInput('open', true);
    fixture.componentRef.setInput('closable', false);
    fixture.detectChanges();

    let closed = false;
    component.closed.subscribe(() => (closed = true));

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(closed).toBe(false);
  });

  it('bloquea el scroll del body cuando open es true', () => {
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();

    expect(document.body.style.overflow).toBe('hidden');
  });

  it('restaura el scroll del body al cerrar', () => {
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();

    fixture.componentRef.setInput('open', false);
    fixture.detectChanges();

    expect(document.body.style.overflow).toBe('');
  });
});
