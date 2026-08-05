import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';

import { CartoonyButtonComponent } from '../cartoony-button/cartoony-button.component';
import { BackHomeComponent } from './back-home.component';

describe('BackHomeComponent', () => {
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BackHomeComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    router = TestBed.inject(Router);
  });

  it('crea el componente', () => {
    const fixture = TestBed.createComponent(BackHomeComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-test="back-home-button"]')).toBeTruthy();
  });

  it('navega a la página principal al pulsarlo', fakeAsync(() => {
    const fixture = TestBed.createComponent(BackHomeComponent);
    fixture.detectChanges();
    const navigateSpy = spyOn(router, 'navigate').and.resolveTo(true);

    const button = fixture.debugElement
      .query(By.css('[data-test="back-home-button"]'))
      .query(By.css('button')).nativeElement as HTMLButtonElement;
    button.click();
    tick();

    expect(navigateSpy).toHaveBeenCalledWith(['/connect']);
  }));

  it('expone un botón real de la librería', () => {
    const fixture = TestBed.createComponent(BackHomeComponent);
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.directive(CartoonyButtonComponent))).toBeTruthy();
  });
});
