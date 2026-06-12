import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SlideOverService } from './slide-over.service';

@Component({
  selector: 'app-slide-over',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (svc.current(); as req) {
      <div class="slide-over-backdrop" (click)="svc.close()"></div>
      <div class="slide-over-panel">
        <div class="slide-over-header">
          <strong>{{ req.title || '' }}</strong>
          <button type="button" class="btn btn-sm btn-light" (click)="svc.close()">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div class="p-3">
          <ng-container *ngTemplateOutlet="req.template; context: { $implicit: req.context }"></ng-container>
        </div>
      </div>
    }
  `,
})
export class SlideOverComponent {
  svc = inject(SlideOverService);
}
