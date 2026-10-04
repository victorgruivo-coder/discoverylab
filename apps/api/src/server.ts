import cors from '@fastify/cors';
import Fastify, { type FastifyError, type FastifyInstance } from 'fastify';

import { config, isDevelopment } from './config.js';
import { AppError, notFound, type ApiErrorBody } from './errors.js';
import { healthRoutes } from './routes/health.js';

/** Builds the Fastify instance fully configured, but never listening. */
export async function buildServer(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: isDevelopment
      ? {
          level: config.LOG_LEVEL,
          transport: { target: 'pino-pretty' },
        }
      : {
          level: config.LOG_LEVEL,
        },
  });

  await app.register(cors, {
    origin: config.WEB_ORIGIN,
    credentials: true,
  });

  // Fastify types this parameter as `unknown`; FastifyError is what the
  // framework actually hands over (it carries `validation`).
  app.setErrorHandler<FastifyError>((error, request, reply) => {
    if (error instanceof AppError) {
      const body: ApiErrorBody = {
        error: {
          code: error.code,
          message: error.message,
        },
      };

      if (error.details !== undefined) {
        body.error.details = error.details;
      }

      return reply.status(error.statusCode).send(body);
    }

    if (error.validation) {
      return reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request',
          details: error.validation,
        },
      } satisfies ApiErrorBody);
    }

    request.log.error({ err: error }, 'unhandled error');

    // The raw message is never returned: it could leak internals.
    return reply.status(500).send({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      },
    } satisfies ApiErrorBody);
  });

  // Unmatched routes return the same body shape as every other error; Fastify's
  // built-in 404 body does not match the contract. Throwing AppError reuses the
  // handler above.
  app.setNotFoundHandler(() => {
    throw notFound('Route not found');
  });

  await app.register(healthRoutes, { prefix: '/api/v1' });

  return app;
}
