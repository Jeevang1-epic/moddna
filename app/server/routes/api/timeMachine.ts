import { context as devvitContext } from '@devvit/web/server';
import { Hono } from 'hono';
import type { TimeMachineAnalyzeErrorResponse } from '../../../../src/shared/contracts/time-machine';
import { json } from '../../../../lib/server/http';
import { analyzeTimeMachine } from '../../../../services/moderation/timeMachine/analyzeTimeMachine';
import { parseTimeMachineRequest } from './validators';

export const createTimeMachineRoutes = (): Hono => {
  const router = new Hono();

  router.post('/time-machine/analyze', async (ctx) => {
    try {
      const payload = await ctx.req.json<unknown>();
      const request = parseTimeMachineRequest(payload);
      const response = await analyzeTimeMachine(request, {
        subredditName: devvitContext.subredditName ?? undefined,
      });
      return json(ctx, 200, response);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to analyze time machine request.';

      return json(ctx, 400, {
        status: 'error',
        message,
      } satisfies TimeMachineAnalyzeErrorResponse);
    }
  });

  return router;
};
