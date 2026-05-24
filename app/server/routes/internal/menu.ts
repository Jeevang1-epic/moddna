import { context } from '@devvit/web/server';
import type { UiResponse } from '@devvit/web/shared';
import { Hono } from 'hono';
import { createModDnaPost } from '../../../../services/reddit/post/createModDnaPost';
import { json } from '../../../../lib/server/http';

export const createMenuRoutes = (): Hono => {
  const router = new Hono();

  router.post('/post-create', async (ctx) => {
    const subredditName = context.subredditName;
    if (!subredditName) {
      return json(ctx, 400, {
        showToast: 'Subreddit context is unavailable',
      } satisfies UiResponse);
    }

    try {
      const post = await createModDnaPost({ subredditName });
      return json(ctx, 200, {
        navigateTo: `https://reddit.com/r/${subredditName}/comments/${post.id}`,
      } satisfies UiResponse);
    } catch (error) {
      console.error('Failed to create ModDNA post', error);
      return json(ctx, 500, {
        showToast: 'Failed to create ModDNA post',
      } satisfies UiResponse);
    }
  });

  return router;
};
