import { Routes } from '@angular/router';

import { Qrts07AdjustComponent } from './qrts07/qrts07-adjust.component';
import { Qrts07ListComponent } from './qrts07/qrts07-list.component';

export const routes: Routes = [
  { path: '', redirectTo: 'qrts07', pathMatch: 'full' },
  { path: 'qrts07', component: Qrts07ListComponent },
  { path: 'qrts07/adjust/:id', component: Qrts07AdjustComponent },
  { path: '**', redirectTo: 'qrts07' },
];
