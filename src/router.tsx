import { createRouter, createRoute } from '@tanstack/react-router';
import { Route as rootRoute } from './routes/__root';

// 1. Import our sanitized V3 components directly
import IndexRoute from './routes/index';
import { LoginForm } from './features/auth/components/LoginForm';

// 2. Explicitly define the Dashboard (Index) route
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: IndexRoute,
});

// 3. Explicitly define the Login route
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginForm,
});

// 4. Build the strict routing tree (ignoring all old V2 files)
const routeTree = rootRoute.addChildren([indexRoute, loginRoute]);

// 5. Initialize the TanStack Router
export const router = createRouter({
  routeTree,
});

// Register the router for strict TypeScript safety across the app
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}