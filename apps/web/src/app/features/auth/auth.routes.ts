import { Routes } from '@angular/router';

import { ROUTE_PATHS } from '../../core/constants/routes';

export const AUTH_ROUTES: Routes = [
  { path: '', redirectTo: ROUTE_PATHS.auth.login, pathMatch: 'full' },
  {
    path: ROUTE_PATHS.auth.register,
    loadComponent: () => import('./register/register').then((m) => m.Register),
  },
  {
    path: ROUTE_PATHS.auth.login,
    loadComponent: () => import('./login/login').then((m) => m.Login),
  },
];
