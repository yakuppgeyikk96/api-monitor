import { inject } from '@angular/core';
import type { CanActivateFn } from '@angular/router';
import { Router } from '@angular/router';

import { ROUTE_PATHS } from '../constants/routes';
import { AuthStore } from '../services/auth-store';

export const guestGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (!authStore.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree([ROUTE_PATHS.dashboard.full]);
};
