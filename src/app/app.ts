import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { MobileModalComponent } from './shared/mobile-modal.component';
import { SlideOverComponent } from './shared/slide-over.component';
import { SnackbarComponent } from './shared/snackbar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MobileModalComponent, SlideOverComponent, SnackbarComponent],
  template: `
    <router-outlet></router-outlet>
    <app-slide-over></app-slide-over>
    <app-mobile-modal></app-mobile-modal>
    <app-snackbar></app-snackbar>
  `,
})
export class App {}
