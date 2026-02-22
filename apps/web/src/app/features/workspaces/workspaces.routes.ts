import { Routes } from '@angular/router';

import { ROUTE_PATHS } from '../../core/constants/routes';

export const WORKSPACES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./workspaces').then((m) => m.Workspaces),
  },
  {
    path: ROUTE_PATHS.workspaces.create,
    loadComponent: () => import('./create-workspace').then((m) => m.CreateWorkspace),
  },
];
