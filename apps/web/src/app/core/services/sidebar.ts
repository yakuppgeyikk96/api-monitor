import { computed, Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SidebarService {
  private _collapsed = signal(false);

  readonly collapsed = this._collapsed.asReadonly();
  readonly width = computed(() => (this._collapsed() ? '72px' : '256px'));

  toggle(): void {
    this._collapsed.update((v) => !v);
  }
}
