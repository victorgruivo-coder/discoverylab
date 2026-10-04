import { db } from '../db.js';

import type { FastifyPluginCallback } from 'fastify';

/**
 * Liveness plus database reachability. The query is caught and translated here,
 * so a database outage never reaches the error handler.
 */
export const healthRoutes: FastifyPluginCallback = (app, _options, done) => {
  app.get('/health', async (_request, reply) => {
    try {
      await db.$queryRaw`SELECT 1`;

      return { ok: true, db: 'up' };
    } catch {
      return reply.status(503).send({ ok: false, db: 'down' });
    }
  });

  done();
};
