import { computed, inject, Injectable, signal } from '@angular/core';
import type { AuthUser } from '@repo/shared-types';

import { AuthApi } from './auth-api';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private authApi = inject(AuthApi);

  private _user = signal<AuthUser | null>(null);

  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);

  setUser(user: AuthUser): void {
    this._user.set(user);
  }

  clear(): void {
    this._user.set(null);
  }

  init(): Promise<void> {
    return new Promise((resolve) => {
      this.authApi.me().subscribe({
        next: (res) => {
          this._user.set(res.data);
          resolve();
        },
        error: () => {
          resolve();
        },
      });
    });
  }
}
