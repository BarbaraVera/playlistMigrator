import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { CartoonyCardComponent } from './cartoony-card.component';

describe('CartoonyCardComponent', () => {
  let fixture: ComponentFixture<CartoonyCardComponent>;
  let component: CartoonyCardComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CartoonyCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CartoonyCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('crea el componente', () => {
    expect(component).toBeTruthy();
  });

  it('muestra el título en un header', () => {
    fixture.componentRef.setInput('title', 'Mi Playlist');
    fixture.detectChanges();

    const title = fixture.debugElement.query(By.css('header h3')).nativeElement;
    expect(title.textContent).toContain('Mi Playlist');
  });

  it('no muestra header sin título', () => {
    expect(fixture.debugElement.query(By.css('header'))).toBeNull();
  });

  it('aplica la variante "pop"', () => {
    fixture.componentRef.setInput('variant', 'pop');
    fixture.detectChanges();

    const card = fixture.debugElement.query(By.css('article')).nativeElement;
    expect(card.classList).toContain('bg-sun');
  });

  it('aplica la sombra elevada cuando elevated es true', () => {
    fixture.componentRef.setInput('elevated', true);
    fixture.detectChanges();

    const card = fixture.debugElement.query(By.css('article')).nativeElement;
    expect(card.classList).toContain('shadow-game-lg');
  });
});
