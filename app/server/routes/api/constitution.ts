import { context as devvitContext } from '@devvit/web/server';
import { Hono } from 'hono';
import type { ConstitutionBuildErrorResponse } from '../../../../src/shared/contracts/constitution';
import { json } from '../../../../lib/server/http';
import { buildConstitution } from '../../../../services/moderation/constitution/buildConstitution';
import { loadSubredditRules } from '../../../../services/reddit/subreddit/loadSubredditRules';
import { parseConstitutionRequest } from './validators';

export const createConstitutionRoutes = (): Hono => {
  const router = new Hono();

  router.post('/constitution/build', async (ctx) => {
    try {
      const payload = await ctx.req.json<unknown>();
      const request = parseConstitutionRequest(payload);
      const liveRules =
        request.rules.length === 0
          ? await loadSubredditRules(devvitContext.subredditName ?? undefined)
          : [];
      const response = buildConstitution({
        ...request,
        rules: request.rules.length > 0 ? request.rules : liveRules,
      });
      return json(ctx, 200, response);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to build constitution output.';

      return json(ctx, 400, {
        status: 'error',
        message,
      } satisfies ConstitutionBuildErrorResponse);
    }
  });

  return router;
};
