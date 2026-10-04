import type {
  PrismaClient,
  Session,
  User,
} from '../../generated/prisma/client.js';

/** DB access only: no business rules, no HTTP. */

export async function findUserByEmail(
  db: PrismaClient,
  email: string,
): Promise<User | null> {
  return db.user.findUnique({ where: { email } });
}

export async function findUserById(
  db: PrismaClient,
  id: string,
): Promise<User | null> {
  return db.user.findUnique({ where: { id } });
}

export async function createUser(
  db: PrismaClient,
  input: { email: string; passwordHash: string; name: string },
): Promise<User> {
  return db.user.create({ data: input });
}

export async function createSession(
  db: PrismaClient,
  input: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    userAgent: string | null;
    ip: string | null;
  },
): Promise<Session> {
  return db.session.create({ data: input });
}

export async function findSessionByTokenHash(
  db: PrismaClient,
  tokenHash: string,
): Promise<Session | null> {
  return db.session.findUnique({ where: { tokenHash } });
}

/**
 * deleteMany rather than delete: logging out twice (or racing logouts) must be
 * a no-op, not a P2025 error.
 */
export async function deleteSession(
  db: PrismaClient,
  sessionId: string,
): Promise<void> {
  await db.session.deleteMany({ where: { id: sessionId } });
}

export async function updateSessionExpiry(
  db: PrismaClient,
  sessionId: string,
  expiresAt: Date,
): Promise<void> {
  await db.session.update({ where: { id: sessionId }, data: { expiresAt } });
}
