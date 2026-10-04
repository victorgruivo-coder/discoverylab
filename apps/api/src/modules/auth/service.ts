import { createHash, randomBytes } from 'node:crypto';

import argon2 from 'argon2';

import * as repoFunctions from './repo.js';
import { db } from '../../db.js';
import { AppError } from '../../errors.js';
import { Prisma } from '../../generated/prisma/client.js';

import type { AuthUser, UserOutput } from './schemas.js';
import type { Session, User } from '../../generated/prisma/client.js';

// Business logic only: no HTTP, no SQL.

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const SESSION_REFRESH_THRESHOLD_MS = 6 * 24 * 60 * 60 * 1000;

type RequestContext = {
  userAgent: string | null;
  ip: string | null;
};

function toUserOutput(user: User): UserOutput {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

/** argon2id with the library's default cost parameters. */
export async function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain, { type: argon2.argon2id });
}

export async function verifyPassword(
  hash: string,
  plain: string,
): Promise<boolean> {
  try {
    return await argon2.verify(hash, plain);
  } catch {
    // A malformed stored hash must read as "wrong password", not a 500.
    return false;
  }
}

export function generateSessionToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

async function startSession(
  userId: string,
  context: RequestContext,
): Promise<string> {
  const rawToken = generateSessionToken();

  await repoFunctions.createSession(db, {
    userId,
    tokenHash: hashSessionToken(rawToken),
    expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    userAgent: context.userAgent,
    ip: context.ip,
  });

  return rawToken;
}

export async function signup(
  input: { email: string; password: string; name: string },
  context: RequestContext,
): Promise<{ user: UserOutput; rawToken: string }> {
  const existing = await repoFunctions.findUserByEmail(db, input.email);

  if (existing !== null) {
    throw new AppError('Email already in use', 'EMAIL_TAKEN', 409);
  }

  const passwordHash = await hashPassword(input.password);

  let created: User;

  try {
    created = await repoFunctions.createUser(db, {
      email: input.email,
      passwordHash,
      name: input.name,
    });
  } catch (error) {
    // The pre-check above is not atomic; the unique index is the real guard, so
    // a signup that loses that race must still answer 409, not 500.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new AppError('Email already in use', 'EMAIL_TAKEN', 409);
    }

    throw error;
  }

  const rawToken = await startSession(created.id, context);

  return { user: toUserOutput(created), rawToken };
}

// Known v1 limitation: unknown email skips argon2, so responses are measurably
// faster than wrong-password. Fix in v2 by always running argon2 against a
// dummy hash.
export async function login(
  input: { email: string; password: string },
  context: RequestContext,
): Promise<{ user: UserOutput; rawToken: string }> {
  const user = await repoFunctions.findUserByEmail(db, input.email);
  const passwordMatches =
    user === null
      ? false
      : await verifyPassword(user.passwordHash, input.password);

  // One code, one message, whether or not the email exists.
  if (user === null || !passwordMatches) {
    throw new AppError('Invalid email or password', 'INVALID_CREDENTIALS', 401);
  }

  const rawToken = await startSession(user.id, context);

  return { user: toUserOutput(user), rawToken };
}

export async function logout(rawToken: string): Promise<void> {
  const session = await repoFunctions.findSessionByTokenHash(
    db,
    hashSessionToken(rawToken),
  );

  if (session === null) {
    return;
  }

  await repoFunctions.deleteSession(db, session.id);
}

export async function resolveSession(
  rawToken: string,
): Promise<{ user: AuthUser; session: Session } | null> {
  const session = await repoFunctions.findSessionByTokenHash(
    db,
    hashSessionToken(rawToken),
  );

  if (session === null) {
    return null;
  }

  const now = Date.now();

  if (session.expiresAt.getTime() < now) {
    return null;
  }

  const user = await repoFunctions.findUserById(db, session.userId);

  if (user === null) {
    return null;
  }

  // Sliding window: only touch the row once more than a day has elapsed.
  if (session.expiresAt.getTime() - now < SESSION_REFRESH_THRESHOLD_MS) {
    await repoFunctions.updateSessionExpiry(
      db,
      session.id,
      new Date(now + SESSION_TTL_MS),
    );
  }

  return {
    user: { id: user.id, email: user.email, name: user.name },
    session,
  };
}

/** Used by GET /me, which returns the full userOutput shape. */
export async function getUserById(id: string): Promise<UserOutput | null> {
  const user = await repoFunctions.findUserById(db, id);

  return user === null ? null : toUserOutput(user);
}
