import { Hono } from 'hono';
import { createMenuRoutes } from './menu';
import { createTriggerRoutes } from './triggers';

export const createInternalRoutes = (): Hono => {
  const router = new Hono();
  router.route('/menu', createMenuRoutes());
  router.route('/triggers', createTriggerRoutes());
  return router;
};
