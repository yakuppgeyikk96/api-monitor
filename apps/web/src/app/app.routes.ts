import { Routes } from '@angular/router';

import { ROUTE_PATHS } from './core/constants/routes';

export const routes: Routes = [
  {
    path: ROUTE_PATHS.auth.root,
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: ROUTE_PATHS.dashboard.root,
    loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
  },
  { path: '**', redirectTo: ROUTE_PATHS.auth.root },
];
