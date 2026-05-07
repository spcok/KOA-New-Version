import { createRouter, createRoute } from '@tanstack/react-router';
import { rootRoute } from './routes/__root';

// Import Page Components
import IndexRoute from './routes/index';
import { LoginForm } from './features/auth/components/LoginForm';
import { Route as dailyLogsRoute } from './routes/daily-logs';
import { Route as dailyRoundsRoute } from './routes/daily-rounds';
import { Route as animalProfileRoute } from './routes/animals/$animalId';
import { Route as tasksRoute } from './routes/tasks';

// 1. Import the Feeding Schedules Route
import { Route as feedingSchedulesRoute } from './routes/feeding-schedules';

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

// 2. Add the Routes to the Children Array
const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  dailyLogsRoute,
  dailyRoundsRoute,
  animalProfileRoute,
  tasksRoute,
  feedingSchedulesRoute, // <-- Injected here
]);

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}