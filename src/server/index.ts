import 'dotenv/config';
import { serve } from '@hono/node-server';
import { createServer, getServerPort } from '@devvit/web/server';
import { createServerApp } from '../../app/server/createServerApp';

const app = createServerApp();

serve({
  fetch: app.fetch,
  createServer,
  port: getServerPort(),
});
