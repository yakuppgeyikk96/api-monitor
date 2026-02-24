import { Routes } from '@angular/router';

export const ENDPOINTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./endpoints').then((m) => m.Endpoints),
  },
];
