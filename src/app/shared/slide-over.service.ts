import { Injectable, TemplateRef, signal } from '@angular/core';
import { Subject } from 'rxjs';

interface SlideRequest {
  template: TemplateRef<any>;
  title?: string;
  context?: any;
}

@Injectable({ providedIn: 'root' })
export class SlideOverService {
  current = signal<SlideRequest | null>(null);
  closed$ = new Subject<any>();

  open(template: TemplateRef<any>, title?: string, context?: any) {
    this.current.set({ template, title, context });
  }

  close(result?: any) {
    if (!this.current()) return;
    this.current.set(null);
    this.closed$.next(result);
  }
}
