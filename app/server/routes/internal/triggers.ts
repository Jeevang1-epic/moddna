import { context } from '@devvit/web/server';
import type { OnAppInstallRequest, TriggerResponse } from '@devvit/web/shared';
import { Hono } from 'hono';
import { createModDnaPost } from '../../../../services/reddit/post/createModDnaPost';
import { json } from '../../../../lib/server/http';

export const createTriggerRoutes = (): Hono => {
  const router = new Hono();

  router.post('/on-app-install', async (ctx) => {
    const subredditName = context.subredditName;
    if (!subredditName) {
      return json(ctx, 400, {
        status: 'error',
        message: 'Subreddit context is unavailable',
      } satisfies TriggerResponse);
    }

    try {
      const input = await ctx.req.json<OnAppInstallRequest>();
      const post = await createModDnaPost({ subredditName });

      return json(ctx, 200, {
        status: 'success',
        message: `Created ModDNA post ${post.id} during ${input.type}`,
      } satisfies TriggerResponse);
    } catch (error) {
      console.error('Failed to run onAppInstall trigger', error);
      return json(ctx, 500, {
        status: 'error',
        message: 'Failed to initialize ModDNA post during app install',
      } satisfies TriggerResponse);
    }
  });

  return router;
};
