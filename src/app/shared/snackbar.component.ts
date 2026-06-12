import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SnackbarService } from './snackbar.service';

@Component({
  selector: 'app-snackbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (snack.current(); as s) {
      <div class="snackbar" [class.error]="s.kind === 'error'">{{ s.text }}</div>
    }
  `,
})
export class SnackbarComponent {
  snack = inject(SnackbarService);
}
