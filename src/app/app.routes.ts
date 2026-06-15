import { Routes } from '@angular/router';

import { InventoryCountAdjustComponent } from './inventory-count/inventory-count-adjust.component';
import { InventoryCountListComponent } from './inventory-count/inventory-count-list.component';

export const routes: Routes = [
  { path: '', redirectTo: 'inventory-count', pathMatch: 'full' },
  { path: 'inventory-count', component: InventoryCountListComponent },
  { path: 'inventory-count/adjust/:id', component: InventoryCountAdjustComponent },
  { path: '**', redirectTo: 'inventory-count' },
];
