import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MobileModalService } from './mobile-modal.service';

@Component({
  selector: 'app-mobile-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (svc.current(); as req) {
      <div class="modal-backdrop-c" (click)="onBackdrop($event)">
        <div class="modal-card" (click)="$event.stopPropagation()">
          @if (req.isConfirm) {
            <div class="modal-header-c">{{ req.header }}</div>
            <p>{{ req.text }}</p>
            <div class="modal-action">
              <button type="button" class="btn btn-mobile" (click)="svc.close(true)">ตกลง</button>
              <button type="button" class="btn btn-mobile-secondary" (click)="svc.close(false)">ยกเลิก</button>
            </div>
          } @else {
            @if (req.header) {
              <div class="modal-header-c">{{ req.header }}</div>
            }
            <ng-container *ngTemplateOutlet="req.template!"></ng-container>
          }
        </div>
      </div>
    }
  `,
})
export class MobileModalComponent {
  svc = inject(MobileModalService);
  onBackdrop(_e: MouseEvent) { /* tap outside does nothing — must use buttons */ }
}
