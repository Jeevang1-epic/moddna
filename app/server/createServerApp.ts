import { Hono } from 'hono';
import { createApiRoutes } from './routes/api';
import { createInternalRoutes } from './routes/internal';

export const createServerApp = (): Hono => {
  const app = new Hono();

  app.route('/api', createApiRoutes());
  app.route('/internal', createInternalRoutes());

  return app;
};
