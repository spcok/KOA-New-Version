import { createRouter, createRoute } from '@tanstack/react-router';
import { rootRoute } from './routes/__root';

// Core Pages
import IndexRoute from './routes/index';
import { LoginForm } from './features/auth/components/LoginForm';
import { Route as dailyLogsRoute } from './routes/daily-logs';
import { Route as dailyRoundsRoute } from './routes/daily-rounds';
import { Route as animalProfileRoute } from './routes/animals/$animalId';

// Husbandry
import { Route as tasksRoute } from './routes/tasks';
import { Route as feedingSchedulesRoute } from './routes/feeding-schedules';

// Safety & Maintenance
import { Route as maintenanceRoute } from './routes/maintenance';
import { Route as incidentsRoute } from './routes/incidents';
import { Route as safetyIncidentsRoute } from './routes/safety-incidents';
import { Route as fireDrillsRoute } from './routes/fire-drills';

// Medical (New)
import { Route as medicalIndexRoute } from './routes/medical/index';
import { Route as medicalIsolationRoute } from './routes/medical/isolation';
import { Route as medicalScheduleRoute } from './routes/medical/schedule';
import { Route as medicalMedicationsRoute } from './routes/medical/medications';
import { Route as medicalRecordsRoute } from './routes/medical/records';

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
  medicalIndexRoute,
  medicalIsolationRoute,
  medicalScheduleRoute,
  medicalMedicationsRoute,
  medicalRecordsRoute
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