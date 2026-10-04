import {
  discoveryCreateInput,
  discoveryListQuery,
  discoveryOutput,
  discoveryParams,
  discoveryUpdateInput,
} from './schemas.js';
import { create, getById, list, remove, update } from './service.js';
import { AppError, validationError } from '../../errors.js';

import type { AuthUser } from '../auth/schemas.js';
import type { FastifyPluginCallback, FastifyRequest } from 'fastify';
import type { ZodType } from 'zod';

/** HTTP layer only: validate, call the service, send a body. */

/**
 * Zod failures carry issues the error handler already rewrites to
 * `{ path, message }`, so the raw issue list is safe to attach as `details`.
 * Well-formed-but-rejected payloads (the service's range rule) stay BAD_REQUEST.
 */
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

export const discoveryRoutes: FastifyPluginCallback = (app, _options, done) => {
  // Every route in this module is private. The root instance owns the decorator.
  app.addHook('preHandler', app.requireAuth);

  app.post('/', async (request, reply) => {
    const user = currentUser(request);
    const body = parse(discoveryCreateInput, request.body);
    const created = await create(user.id, user.name, body);

    return reply.status(201).send(discoveryOutput.parse(created));
  });

  app.get('/', async (request, reply) => {
    const user = currentUser(request);
    const query = parse(discoveryListQuery, request.query);
    const result = await list(user.id, query);

    return reply.status(200).send({
      items: result.items.map((item) => discoveryOutput.parse(item)),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  });

  app.get('/:id', async (request, reply) => {
    const user = currentUser(request);
    const { id } = parse(discoveryParams, request.params);
    const found = await getById(user.id, id);

    return reply.status(200).send(discoveryOutput.parse(found));
  });

  app.patch('/:id', async (request, reply) => {
    const user = currentUser(request);
    const { id } = parse(discoveryParams, request.params);
    const body = parse(discoveryUpdateInput, request.body);
    const updated = await update(user.id, id, body);

    return reply.status(200).send(discoveryOutput.parse(updated));
  });

  app.delete('/:id', async (request, reply) => {
    const user = currentUser(request);
    const { id } = parse(discoveryParams, request.params);

    await remove(user.id, id);

    return reply.status(204).send();
  });

  done();
};
