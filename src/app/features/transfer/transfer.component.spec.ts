import { Injectable } from '@angular/core';
import { fakeAsync, flush, TestBed, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ComponentFixture } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { providePlatformAuthServices } from '../../core/services/platform-auth.providers';
import { PlaylistSelectionService } from '../../core/services/playlist-selection.service';
import { TransferRunnerService } from '../../core/services/transfer-runner.service';
import { TransferComponent } from './transfer.component';

@Injectable()
class ControlledRunner extends TransferRunnerService {
  protected override trackDelayMs(): number {
    return 100;
  }

  protected override playlistDelayMs(): number {
    return 100;
  }
}

describe('TransferComponent', () => {
  function select(ids: readonly string[]): void {
    const selection = TestBed.inject(PlaylistSelectionService);
    selection.load();
    tick(900);
    for (const id of ids) {
      selection.toggle(id);
    }
  }

  function createFixture(): ComponentFixture<TransferComponent> {
    const fixture = TestBed.createComponent(TransferComponent);
    fixture.detectChanges();
    return fixture;
  }

  function clickButton(fixture: ComponentFixture<TransferComponent>, testId: string): void {
    const button = fixture.debugElement.query(By.css(`[data-test=${testId}] button`))
      .nativeElement as HTMLButtonElement;
    button.click();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransferComponent],
      providers: [
        provideRouter([]),
        providePlatformAuthServices(),
        ControlledRunner,
        { provide: TransferRunnerService, useExisting: ControlledRunner },
      ],
    }).compileComponents();
  });

  it('redirige a selección sin playlists marcadas', fakeAsync(() => {
    const router = TestBed.inject(Router);
    const navigateSpy = spyOn(router, 'navigate').and.resolveTo(true);

    const fixture = createFixture();
    tick();

    expect(navigateSpy).toHaveBeenCalledWith(['/playlist-selection']);
    expect(fixture.nativeElement.textContent).toContain('Paso 3 · Transferencia');
  }));

  it('muestra el progreso y las playlists durante la migración', fakeAsync(() => {
    select(['pl-rock-clasico', 'pl-chill-tarde']);

    const fixture = createFixture();
    tick(300);

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Progreso general');
    expect(text).toContain('Playlists en proceso');
    expect(text).toContain('Rock Clásico');
    expect(text).toContain('Chill de Tarde');
    expect(text).toContain('Registro de actividad');
    expect(fixture.debugElement.query(By.css('app-cartoony-progress-bar'))).toBeTruthy();

    flush(200000);
  }));

  it('pausa y reanuda desde la UI', fakeAsync(() => {
    const runner = TestBed.inject(TransferRunnerService);
    select(['pl-duermete-bebe']);

    const fixture = createFixture();
    tick(300);

    clickButton(fixture, 'pause-button');
    expect(runner.paused()).toBeTrue();
    expect(fixture.nativeElement.textContent).toContain('Reanudar');

    tick(1000);
    const pausedCount = runner.processedTracks();
    tick(1000);
    expect(runner.processedTracks()).toBe(pausedCount);

    clickButton(fixture, 'pause-button');
    expect(runner.paused()).toBeFalse();
    expect(fixture.nativeElement.textContent).toContain('Pausar');

    flush(200000);
  }));

  it('muestra la pantalla final con el resumen al terminar', fakeAsync(() => {
    const runner = TestBed.inject(TransferRunnerService);
    select(['pl-duermete-bebe']);

    const fixture = createFixture();
    flush(200000);
    fixture.detectChanges();

    expect(runner.status()).toBe('completed');
    expect(runner.summary().totalPlaylists).toBe(1);
    expect(runner.summary().processedTracks).toBe(19);
    expect(runner.summary().successfulTracks).toBe(16);
    expect(runner.summary().failedTracks).toBe(3);

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Mission Complete');
    expect(text).toContain('Ir a YouTube Music');
    expect(text).toContain('Migrar más playlists');
    expect(text).toContain('16');
    expect(text).toContain('3');
  }));

  it('migrar más playlists resetea y vuelve a selección', fakeAsync(() => {
    const router = TestBed.inject(Router);
    const navigateSpy = spyOn(router, 'navigate').and.resolveTo(true);
    const selection = TestBed.inject(PlaylistSelectionService);
    const runner = TestBed.inject(TransferRunnerService);
    select(['pl-gym-power']);

    const fixture = createFixture();
    flush(200000);
    fixture.detectChanges();

    clickButton(fixture, 'migrate-button');
    tick();

    expect(runner.status()).toBe('idle');
    expect(selection.selectedCount()).toBe(0);
    expect(navigateSpy).toHaveBeenCalledWith(['/playlist-selection']);
  }));

  it('cancela la transferencia desde la UI', fakeAsync(() => {
    const runner = TestBed.inject(TransferRunnerService);
    select(['pl-roadtrip-2026']);

    const fixture = createFixture();
    tick(300);

    clickButton(fixture, 'cancel-button');
    flush(200000);
    fixture.detectChanges();

    expect(runner.status()).toBe('cancelled');
    expect(fixture.nativeElement.textContent).toContain('Transferencia cancelada');
  }));
});
