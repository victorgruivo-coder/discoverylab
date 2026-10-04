import type { DiscoveryStatus, DiscoveryType } from '@discoverylab/shared';

import type {
  Discovery,
  Prisma,
  PrismaClient,
} from '../../generated/prisma/client.js';

/** DB access only: no business rules, no HTTP. */

/** Caller-supplied values for a new row; the service owns the defaults. */
export type DiscoveryCreateData = {
  createdByUserId: string;
  name: string;
  leadName: string;
  type: DiscoveryType;
  status: DiscoveryStatus;
  startDate: Date;
  endDate: Date | null;
};

/**
 * Every field is optional, and an absent key means "leave the column alone".
 * `createdByUserId` is deliberately not updatable: a row never changes owner.
 */
export type DiscoveryUpdateData = {
  name?: string;
  leadName?: string;
  type?: DiscoveryType;
  startDate?: Date;
  endDate?: Date;
  status?: DiscoveryStatus;
};

export type DiscoveryListParams = {
  status?: DiscoveryStatus | undefined;
  search?: string | undefined;
  sort: 'updatedAt' | 'createdAt' | 'name';
  order: 'asc' | 'desc';
  page: number;
  limit: number;
};

/** Soft-deleted rows are invisible to every read in this module. */
const liveOnly: Prisma.DiscoveryWhereInput = { deletedAt: null };

export async function create(
  db: PrismaClient,
  data: DiscoveryCreateData,
): Promise<Discovery> {
  return db.discovery.create({ data });
}

export async function findById(
  db: PrismaClient,
  id: string,
  userId: string,
): Promise<Discovery | null> {
  // findFirst, not findUnique: ownership and soft delete are filters, not part
  // of the unique key.
  return db.discovery.findFirst({
    where: { ...liveOnly, id, createdByUserId: userId },
  });
}

export async function list(
  db: PrismaClient,
  userId: string,
  params: DiscoveryListParams,
): Promise<{ items: Discovery[]; total: number }> {
  const { status, search, sort, order, page, limit } = params;

  const where: Prisma.DiscoveryWhereInput = {
    ...liveOnly,
    createdByUserId: userId,
    ...(status === undefined ? {} : { status }),
    // Name-only search, case-insensitive substring (v1 scope).
    ...(search === undefined
      ? {}
      : { name: { contains: search, mode: 'insensitive' } }),
  };

  const orderBy: Prisma.DiscoveryOrderByWithRelationInput =
    sort === 'name'
      ? { name: order }
      : sort === 'createdAt'
        ? { createdAt: order }
        : { updatedAt: order };

  // Both statements read the same snapshot; without the transaction a row
  // created between them would make total disagree with items.
  const [items, total] = await db.$transaction([
    db.discovery.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.discovery.count({ where }),
  ]);

  return { items, total };
}

/**
 * updateMany rather than update: the ownership filter has to be part of the
 * statement, so a foreign or deleted row can never be written. A count of 0 is
 * "no such row for you", which the service turns into a 404.
 */
export async function update(
  db: PrismaClient,
  id: string,
  userId: string,
  data: DiscoveryUpdateData,
): Promise<Discovery | null> {
  const { count } = await db.discovery.updateMany({
    where: { ...liveOnly, id, createdByUserId: userId },
    data,
  });

  if (count === 0) {
    return null;
  }

  // Re-read through the same scope so the caller gets the persisted row.
  return findById(db, id, userId);
}

/** Returns true only when this user's live row was the one that got stamped. */
export async function softDelete(
  db: PrismaClient,
  id: string,
  userId: string,
): Promise<boolean> {
  const { count } = await db.discovery.updateMany({
    where: { ...liveOnly, id, createdByUserId: userId },
    data: { deletedAt: new Date() },
  });

  return count > 0;
}
