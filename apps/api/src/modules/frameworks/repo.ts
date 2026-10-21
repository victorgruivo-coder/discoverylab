import type {
  FrameworkInstance,
  Prisma,
  PrismaClient,
} from '../../generated/prisma/client.js';

/** DB access only: no business rules, no HTTP. */

/**
 * The composite unique key is the natural lookup: one instance per
 * (discovery, framework). Ownership is checked by the service before calling
 * this, so the repo stays a plain data operation.
 */
export async function findByDiscoveryAndKey(
  db: PrismaClient,
  discoveryId: string,
  frameworkKey: string,
): Promise<FrameworkInstance | null> {
  return db.frameworkInstance.findUnique({
    where: { discoveryId_frameworkKey: { discoveryId, frameworkKey } },
  });
}

export async function listByDiscovery(
  db: PrismaClient,
  discoveryId: string,
): Promise<FrameworkInstance[]> {
  return db.frameworkInstance.findMany({
    where: { discoveryId },
    orderBy: { frameworkKey: 'asc' },
  });
}

/**
 * `content` is already validated and, for RICE, already scored by the service.
 * Postgres stores it as JSONB; Prisma serializes the object as-is.
 */
export async function upsert(
  db: PrismaClient,
  discoveryId: string,
  frameworkKey: string,
  content: Prisma.InputJsonValue,
): Promise<FrameworkInstance> {
  return db.frameworkInstance.upsert({
    where: { discoveryId_frameworkKey: { discoveryId, frameworkKey } },
    create: { discoveryId, frameworkKey, content },
    update: { content },
  });
}
