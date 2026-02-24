import { Routes } from '@angular/router';

import { ROUTE_PATHS } from './core/constants/routes';
import { authGuard } from './core/guards/auth-guard';
import { guestGuard } from './core/guards/guest-guard';

export const routes: Routes = [
  {
    path: ROUTE_PATHS.auth.root,
    canActivate: [guestGuard],
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./core/layout/layout').then((m) => m.Layout),
    children: [
      {
        path: ROUTE_PATHS.dashboard.root,
        loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: ROUTE_PATHS.workspaces.root,
        loadChildren: () =>
          import('./features/workspaces/workspaces.routes').then((m) => m.WORKSPACES_ROUTES),
      },
      {
        path: ROUTE_PATHS.services.root,
        loadChildren: () =>
          import('./features/services/services.routes').then((m) => m.SERVICES_ROUTES),
      },
      {
        path: ROUTE_PATHS.endpoints.root,
        loadChildren: () =>
          import('./features/endpoints/endpoints.routes').then((m) => m.ENDPOINTS_ROUTES),
      },
      { path: '', redirectTo: ROUTE_PATHS.dashboard.root, pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: ROUTE_PATHS.auth.root },
];
