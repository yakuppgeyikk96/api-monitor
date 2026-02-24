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
  },
  services: {
    root: 'services',
    full: '/services',
  },
  endpoints: {
    root: 'endpoints',
    full: '/endpoints',
  },
} as const;
