import { Routes } from '@angular/router';

import { requireConnectionsGuard } from './core/guards/require-connections.guard';
import { ConnectComponent } from './features/connect/connect.component';
import { PlaylistSelectionComponent } from './features/playlist-selection/playlist-selection.component';
import { TransferComponent } from './features/transfer/transfer.component';
import { UiKitDemoComponent } from './features/ui-kit-demo/ui-kit-demo.component';

export const routes: Routes = [
  { path: '', redirectTo: 'connect', pathMatch: 'full' },
  { path: 'connect', component: ConnectComponent },
  {
    path: 'playlist-selection',
    component: PlaylistSelectionComponent,
    canActivate: [requireConnectionsGuard],
  },
  { path: 'transfer', component: TransferComponent, canActivate: [requireConnectionsGuard] },
  { path: 'ui-kit', component: UiKitDemoComponent },
];
