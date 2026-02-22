export const ROUTE_PATHS = {
  auth: {
    root: 'auth',
    login: 'login',
    register: 'register',
    loginFull: '/auth/login',
    registerFull: '/auth/register',
  },
  dashboard: {
    root: 'dashboard',
    full: '/dashboard',
  },
  workspaces: {
    root: 'workspaces',
    full: '/workspaces',
    create: 'create',
    createFull: '/workspaces/create',
  },
} as const;
