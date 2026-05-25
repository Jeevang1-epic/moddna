import { Hono } from 'hono';
import type { ConstitutionBuildErrorResponse } from '../../../../src/shared/contracts/constitution';
import { json } from '../../../../lib/server/http';
import { buildConstitution } from '../../../../services/moderation/constitution/buildConstitution';
import { parseConstitutionRequest } from './validators';

export const createConstitutionRoutes = (): Hono => {
  const router = new Hono();

  router.post('/constitution/build', async (context) => {
    try {
      const payload = await context.req.json<unknown>();
      const request = parseConstitutionRequest(payload);
      const response = buildConstitution(request);
      return json(context, 200, response);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to build constitution output.';

      return json(context, 400, {
        status: 'error',
        message,
      } satisfies ConstitutionBuildErrorResponse);
    }
  });

  return router;
};
