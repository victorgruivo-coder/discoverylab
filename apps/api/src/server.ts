import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import Fastify, { type FastifyError, type FastifyInstance } from 'fastify';

import { config, isDevelopment, isProduction } from './config.js';
import { AppError, notFound, type ApiErrorBody } from './errors.js';
import { authRoutes } from './modules/auth/routes.js';
import { registerAuth } from './plugins/auth.js';
import { healthRoutes } from './routes/health.js';

type ValidationIssue = {
  path: Array<string | number>;
  message: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isPath(value: unknown): value is (string | number)[] {
  return (
    Array.isArray(value) &&
    value.every(
      (segment: unknown) =>
        typeof segment === 'string' || typeof segment === 'number',
    )
  );
}

function isValidationIssue(value: unknown): value is ValidationIssue {
  if (!isRecord(value)) {
    return false;
  }

  return typeof value['message'] === 'string' && isPath(value['path']);
}

function isValidationIssueList(value: unknown): value is ValidationIssue[] {
  return (
    Array.isArray(value) &&
    value.every((item: unknown) => isValidationIssue(item))
  );
}

/**
 * Zod issues carry the offending input, regex patterns and expected types.
 * Clients only need the field path and the reason, so details are rewritten
 * before they leave the API. The path stays an array, matching Zod's own
 * `(string | number)[]` and the shape the AJV branch will use.
 */
function toClientDetails(details: unknown): unknown {
  if (!isValidationIssueList(details)) {
    return details;
  }

  return details.map((issue) => ({
    path: issue.path,
    message: issue.message,
  }));
}

/** Builds the Fastify instance fully configured, but never listening. */
export async function buildServer(): Promise<FastifyInstance> {
  const app = Fastify({
    // Render terminates TLS, so the client IP arrives in X-Forwarded-For.
    trustProxy: isProduction,
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

  await app.register(cookie);

  // global: false — only routes that opt in through their route config are
  // limited (POST /auth/login for now).
  // The plugin throws whatever this returns, so returning AppError routes a
  // breach through the existing contract-shaped branch of the error handler.
  await app.register(rateLimit, {
    global: false,
    errorResponseBuilder: (_request, context) =>
      new AppError('Too many requests', 'RATE_LIMITED', 429, {
        retryAfter: context.after,
      }),
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
        body.error.details = toClientDetails(error.details);
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

  // Decorators must land on the root instance before the routes plugin is
  // registered, so the auth routes can reach app.requireAuth.
  registerAuth(app);

  await app.register(healthRoutes, { prefix: '/api/v1' });
  await app.register(authRoutes, { prefix: '/api/v1/auth' });

  return app;
}
