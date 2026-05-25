import { Hono } from 'hono';
import { createConstitutionRoutes } from './constitution';
import { createHealthRoutes } from './health';
import { createTimeMachineRoutes } from './timeMachine';

export const createApiRoutes = (): Hono => {
  const router = new Hono();
  router.route('/', createHealthRoutes());
  router.route('/', createTimeMachineRoutes());
  router.route('/', createConstitutionRoutes());
  return router;
};
