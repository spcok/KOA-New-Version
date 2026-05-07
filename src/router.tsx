import { createRouter, createRoute } from '@tanstack/react-router';
import { rootRoute } from './routes/__root';

// Import Page Components
import IndexRoute from './routes/index';
import { LoginForm } from './features/auth/components/LoginForm';
import { Route as dailyLogsRoute } from './routes/daily-logs';
import { Route as dailyRoundsRoute } from './routes/daily-rounds';
import { Route as animalProfileRoute } from './routes/animals/$animalId';

// Husbandry Routes
import { Route as tasksRoute } from './routes/tasks';
import { Route as feedingSchedulesRoute } from './routes/feeding-schedules';

// Safety & Compliance Routes
import { Route as maintenanceRoute } from './routes/maintenance';
import { Route as incidentsRoute } from './routes/incidents';
import { Route as safetyIncidentsRoute } from './routes/safety-incidents';
import { Route as fireDrillsRoute } from './routes/fire-drills';

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

// Build the Route Tree
const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  dailyLogsRoute,
  dailyRoundsRoute,
  animalProfileRoute,
  tasksRoute,
  feedingSchedulesRoute,
  maintenanceRoute,
  incidentsRoute,
  safetyIncidentsRoute,
  fireDrillsRoute,
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