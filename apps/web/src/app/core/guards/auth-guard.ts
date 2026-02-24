import { inject } from '@angular/core';
import type { CanActivateFn } from '@angular/router';
import { Router } from '@angular/router';

import { ROUTE_PATHS } from '../constants/routes';
import { AuthStore } from '../services/auth-store';

export const authGuard: CanActivateFn = (_route, state) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (authStore.isAuthenticated()) {
    return true;
  }

  const returnUrl = state.url;

  return router.createUrlTree([ROUTE_PATHS.auth.loginFull], {
    queryParams: returnUrl !== '/' ? { returnUrl } : {},
  });
};
