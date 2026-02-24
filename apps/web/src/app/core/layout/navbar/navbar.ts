import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { ROUTE_PATHS } from '../../constants/routes';
import { AuthApi } from '../../services/auth-api';
import { AuthStore } from '../../services/auth-store';
import { SidebarService } from '../../services/sidebar';
import { CircleUserIcon } from '../../../shared/icons/circle-user-icon';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.html',
  imports: [CircleUserIcon],
})
export class Navbar {
  readonly sidebarService = inject(SidebarService);
  readonly authStore = inject(AuthStore);
  private authApi = inject(AuthApi);
  private router = inject(Router);

  protected dropdownOpen = signal(false);

  toggleDropdown(): void {
    this.dropdownOpen.update((v) => !v);
  }

  closeDropdown(): void {
    this.dropdownOpen.set(false);
  }

  logout(): void {
    this.authApi.logout().subscribe({
      next: () => {
        this.authStore.clear();
        this.router.navigateByUrl(ROUTE_PATHS.auth.loginFull);
      },
      error: () => {
        this.authStore.clear();
        this.router.navigateByUrl(ROUTE_PATHS.auth.loginFull);
      },
    });
  }
}
