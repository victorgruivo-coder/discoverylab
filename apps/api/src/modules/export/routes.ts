import { z } from 'zod';

import { getExport } from './service.js';
import { AppError, validationError } from '../../errors.js';
import { discoveryParams } from '../discoveries/schemas.js';

import type { AuthUser } from '../auth/schemas.js';
import type { FastifyPluginCallback, FastifyRequest } from 'fastify';
import type { ZodType } from 'zod';

/** HTTP layer only: validate, call the service, send a body. */

/** The only thing this endpoint returns; the document itself is the payload. */
const exportOutput = z.object({ markdown: z.string() });

function parse<T>(schema: ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);

  if (!result.success) {
    throw validationError(result.error.issues);
  }

  return result.data;
}

/** requireAuth runs first, so this only guards against a wiring mistake. */
function currentUser(request: FastifyRequest): AuthUser {
  const user = request.user;

  if (user === null) {
    throw new AppError('Not authenticated', 'NOT_AUTHENTICATED', 401);
  }

  return user;
}

export const exportRoutes: FastifyPluginCallback = (app, _options, done) => {
  // Private: the root instance owns the decorator.
  app.addHook('preHandler', app.requireAuth);

  app.get('/', async (request, reply) => {
    const user = currentUser(request);
    const { id } = parse(discoveryParams, request.params);
    const result = await getExport(user.id, id);

    return reply.status(200).send(exportOutput.parse(result));
  });

  done();
};
