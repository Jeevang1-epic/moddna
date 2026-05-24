import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

export const json = <T, S extends ContentfulStatusCode>(
  context: Context,
  status: S,
  payload: T
): Response => context.json(payload, status);
