import { Injectable, signal } from '@angular/core';

interface SnackMsg { text: string; kind: 'success' | 'error'; id: number; }

@Injectable({ providedIn: 'root' })
export class SnackbarService {
  private idSeed = 0;
  current = signal<SnackMsg | null>(null);

  success(text: string) { this.show(text, 'success'); }
  error(text: string) { this.show(text, 'error'); }

  private show(text: string, kind: 'success' | 'error') {
    const id = ++this.idSeed;
    this.current.set({ text, kind, id });
    setTimeout(() => {
      if (this.current()?.id === id) this.current.set(null);
    }, 2500);
  }
}
