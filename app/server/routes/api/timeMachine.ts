import { Hono } from 'hono';
import type { TimeMachineAnalyzeErrorResponse } from '../../../../src/shared/contracts/time-machine';
import { json } from '../../../../lib/server/http';
import { analyzeTimeMachine } from '../../../../services/moderation/timeMachine/analyzeTimeMachine';
import { parseTimeMachineRequest } from './validators';

export const createTimeMachineRoutes = (): Hono => {
  const router = new Hono();

  router.post('/time-machine/analyze', async (context) => {
    try {
      const payload = await context.req.json<unknown>();
      const request = parseTimeMachineRequest(payload);
      const response = await analyzeTimeMachine(request);
      return json(context, 200, response);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to analyze time machine request.';

      return json(context, 400, {
        status: 'error',
        message,
      } satisfies TimeMachineAnalyzeErrorResponse);
    }
  });

  return router;
};
