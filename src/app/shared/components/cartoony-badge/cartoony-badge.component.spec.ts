import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { CartoonyBadgeComponent } from './cartoony-badge.component';

describe('CartoonyBadgeComponent', () => {
  let fixture: ComponentFixture<CartoonyBadgeComponent>;
  let component: CartoonyBadgeComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CartoonyBadgeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CartoonyBadgeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('crea el componente', () => {
    expect(component).toBeTruthy();
  });

  it('aplica el estado success', () => {
    fixture.componentRef.setInput('status', 'success');
    fixture.detectChanges();

    const badge = fixture.debugElement.query(By.css('span')).nativeElement;
    expect(badge.classList).toContain('bg-grass');
  });

  it('aplica la clase de pulso al dot cuando pulse es true', () => {
    fixture.componentRef.setInput('pulse', true);
    fixture.detectChanges();

    const dot = fixture.debugElement.query(By.css('.badge-dot')).nativeElement;
    expect(dot.classList).toContain('animate-pulse');
  });
});
