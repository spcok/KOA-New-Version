import { createRouter, createRoute } from '@tanstack/react-router';
import { Route as rootRoute } from './routes/__root';

import IndexRoute from './routes/index';
import { LoginForm } from './features/auth/components/LoginForm';
// IMPORT YOUR NEW ROUTE FILE HERE
import { Route as dailyLogsRoute } from './routes/daily-logs'; 

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: IndexRoute,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginForm,
});

// ADD dailyLogsRoute TO THIS ARRAY
const routeTree = rootRoute.addChildren([
  indexRoute, 
  loginRoute,
  dailyLogsRoute 
]);

export const router = createRouter({
  routeTree,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}