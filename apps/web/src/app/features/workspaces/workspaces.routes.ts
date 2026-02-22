import { Routes } from '@angular/router';

export const WORKSPACES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./workspaces').then((m) => m.Workspaces),
  },
];
