import { type ZodType } from 'zod';

import { loginInput, signupInput, userOutput } from './schemas.js';
import { getUserById, login, logout, signup } from './service.js';
import { AppError, validationError } from '../../errors.js';
import {
  SESSION_COOKIE_NAME,
  clearSessionCookie,
  setSessionCookie,
} from '../../plugins/auth.js';

import type { FastifyPluginCallback, FastifyRequest } from 'fastify';

/** HTTP layer only: validate, call the service, set cookies, send a body. */

const LOGIN_RATE_LIMIT = {
  max: 10,
  timeWindow: 15 * 60 * 1000,
} as const;

function parseBody<T>(schema: ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body);

  if (!result.success) {
    throw validationError(result.error.issues);
  }

  return result.data;
}

function requestContext(request: FastifyRequest): {
  userAgent: string | null;
  ip: string | null;
} {
  const userAgent = request.headers['user-agent'];

  return {
    userAgent: typeof userAgent === 'string' ? userAgent : null,
    ip: request.ip,
  };
}

export const authRoutes: FastifyPluginCallback = (app, _options, done) => {
  app.post('/signup', async (request, reply) => {
    const body = parseBody(signupInput, request.body);
    const { user, rawToken } = await signup(body, requestContext(request));

    setSessionCookie(reply, rawToken);

    return reply.status(201).send(userOutput.parse(user));
  });

  app.post(
    '/login',
    {
      config: {
        rateLimit: {
          ...LOGIN_RATE_LIMIT,
          keyGenerator: (request: FastifyRequest) => request.ip,
        },
      },
    },
    async (request, reply) => {
      const body = parseBody(loginInput, request.body);
      const { user, rawToken } = await login(body, requestContext(request));

      setSessionCookie(reply, rawToken);

      return reply.status(200).send(userOutput.parse(user));
    },
  );

  app.post('/logout', async (request, reply) => {
    const rawToken = request.cookies[SESSION_COOKIE_NAME];

    if (rawToken !== undefined) {
      await logout(rawToken);
    }

    clearSessionCookie(reply);

    return reply.status(204).send();
  });

  app.get('/me', { preHandler: app.requireAuth }, async (request) => {
    const currentUser = request.user;
    const user =
      currentUser === null ? null : await getUserById(currentUser.id);

    if (user === null) {
      throw new AppError('Not authenticated', 'NOT_AUTHENTICATED', 401);
    }

    return userOutput.parse(user);
  });

  done();
};
