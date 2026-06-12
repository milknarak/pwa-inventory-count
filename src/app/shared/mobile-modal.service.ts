import { Injectable, TemplateRef, signal } from '@angular/core';
import { Observable, Subject } from 'rxjs';

interface ModalRequest {
  template?: TemplateRef<any>;
  header?: string;
  text?: string;
  showCancel?: boolean;
  isConfirm?: boolean;
}

@Injectable({ providedIn: 'root' })
export class MobileModalService {
  current = signal<ModalRequest | null>(null);
  private result$ = new Subject<any>();

  openTemplate(template: TemplateRef<any>, header?: string): { afterClosed: () => Observable<any>; close: (v?: any) => void } {
    this.current.set({ template, header });
    const ref = {
      afterClosed: () => this.result$.asObservable(),
      close: (v?: any) => this.close(v),
    };
    return ref;
  }

  confirm(text: string): Observable<boolean> {
    this.current.set({ text, isConfirm: true, header: 'ยืนยัน' });
    return new Observable<boolean>(sub => {
      const sub2 = this.result$.subscribe(v => {
        sub.next(!!v);
        sub.complete();
        sub2.unsubscribe();
      });
    });
  }

  close(result?: any) {
    if (!this.current()) return;
    this.current.set(null);
    this.result$.next(result);
  }
}
