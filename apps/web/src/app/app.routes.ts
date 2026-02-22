import { Routes } from '@angular/router';

import { ROUTE_PATHS } from './core/constants/routes';

export const routes: Routes = [
  {
    path: ROUTE_PATHS.auth.root,
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: '',
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
      { path: '', redirectTo: ROUTE_PATHS.dashboard.root, pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: ROUTE_PATHS.auth.root },
];
