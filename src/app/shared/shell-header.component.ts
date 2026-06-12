import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-shell-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="shell-header">
      <button class="back-btn" (click)="back.emit()" *ngIf="showBack">
        <i class="fa-solid fa-arrow-left"></i>
      </button>
      <div class="title">{{ title }}</div>
    </div>
  `,
})
export class ShellHeaderComponent {
  @Input() title = '';
  @Input() showBack = true;
  @Output() back = new EventEmitter<void>();
}
