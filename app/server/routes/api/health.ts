import { Hono } from 'hono';
import type { HealthResponse } from '../../../../src/shared/contracts/system';
import { readAppEnv } from '../../../../lib/config/env';
import { json } from '../../../../lib/server/http';

export const createHealthRoutes = (): Hono => {
  const router = new Hono();

  router.get('/health', (context) => {
    const env = readAppEnv();
    const response: HealthResponse = {
      status: 'ok',
      app: 'moddna',
      version: '0.1.0',
      storageDriver: env.storageDriver,
    };

    return json(context, 200, response);
  });

  return router;
};
