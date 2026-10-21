import {
  frameworkBodySchema,
  frameworkInstanceOutput,
  frameworkListOutput,
  frameworkParams,
} from './schemas.js';
import { get, list, upsert } from './service.js';
import { AppError, notFound, validationError } from '../../errors.js';

import type { AuthUser } from '../auth/schemas.js';
import type { FastifyPluginCallback, FastifyRequest } from 'fastify';
import type { ZodType } from 'zod';

/** HTTP layer only: validate, call the service, send a body. */

/** List routes have no `:key`, so only the discovery id is in the path. */
const frameworkListParams = frameworkParams.pick({ id: true });

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

export const frameworkRoutes: FastifyPluginCallback = (app, _options, done) => {
  // Every route in this module is private. The root instance owns the decorator.
  app.addHook('preHandler', app.requireAuth);

  app.get('/', async (request, reply) => {
    const user = currentUser(request);
    const { id } = parse(frameworkListParams, request.params);
    const items = await list(user.id, id);

    return reply.status(200).send(frameworkListOutput.parse({ items }));
  });

  app.get('/:key', async (request, reply) => {
    const user = currentUser(request);
    const { id, key } = parse(frameworkParams, request.params);
    const found = await get(user.id, id, key);

    if (found === null) {
      throw notFound('Framework not found');
    }

    return reply.status(200).send(frameworkInstanceOutput.parse(found));
  });

  app.put('/:key', async (request, reply) => {
    const user = currentUser(request);
    const { id, key } = parse(frameworkParams, request.params);
    // The path key selects the shared schema; a body cannot claim another one.
    const body = parse(frameworkBodySchema(key), request.body);
    const saved = await upsert(user.id, id, key, body.content);

    return reply.status(200).send(frameworkInstanceOutput.parse(saved));
  });

  done();
};
