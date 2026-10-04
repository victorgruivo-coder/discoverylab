import { isProduction } from '../config.js';
import { AppError } from '../errors.js';
import { resolveSession } from '../modules/auth/service.js';

import type { AuthUser } from '../modules/auth/schemas.js';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

export const SESSION_COOKIE_NAME = 'discoverylab_session';

const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

declare module 'fastify' {
  interface FastifyInstance {
    requireAuth: (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => Promise<void>;
  }

  interface FastifyRequest {
    user: AuthUser | null;
  }
}

// Known v1 limitation: cookie Max-Age is fixed at 7d from issue. DB expiry
// slides on activity, but the cookie does not. An active user gets re-prompted
// on day 7. Fix in v2 by re-setting the cookie on sliding-window refresh.
export function setSessionCookie(reply: FastifyReply, token: string): void {
  reply.setCookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
    sameSite: isProduction ? 'none' : 'lax',
    secure: isProduction,
  });
}

export function clearSessionCookie(reply: FastifyReply): void {
  reply.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
}

/**
 * Applied to the root instance directly rather than via app.register(): Fastify
 * encapsulates decorators inside registered plugins, so a sibling routes plugin
 * would not see them. (The alternative is the fastify-plugin wrapper.)
 */
export function registerAuth(app: FastifyInstance): void {
  app.decorateRequest('user', null);

  app.decorate(
    'requireAuth',
    async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      const rawToken = request.cookies[SESSION_COOKIE_NAME];

      if (rawToken === undefined) {
        throw new AppError('Not authenticated', 'NOT_AUTHENTICATED', 401);
      }

      const resolved = await resolveSession(rawToken);

      if (resolved === null) {
        clearSessionCookie(reply);

        throw new AppError('Not authenticated', 'NOT_AUTHENTICATED', 401);
      }

      request.user = resolved.user;
    },
  );
}
