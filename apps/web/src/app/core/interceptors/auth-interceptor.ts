import { HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { ROUTE_PATHS } from '../constants/routes';
import { AuthStore } from '../services/auth-store';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && !req.url.includes('/auth/me')) {
        authStore.clear();
        router.navigateByUrl(ROUTE_PATHS.auth.loginFull);
      }
      return throwError(() => err);
    }),
  );
};
