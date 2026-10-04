import * as repo from './repo.js';
import { db } from '../../db.js';
import { badRequest, notFound } from '../../errors.js';

import type { DiscoveryUpdateData } from './repo.js';
import type {
  DiscoveryCreateInput,
  DiscoveryListQuery,
  DiscoveryOutput,
  DiscoveryUpdateInput,
} from './schemas.js';
import type { Discovery } from '../../generated/prisma/client.js';

// Business logic only: no HTTP, no SQL.

/**
 * Postgres hands back a `date` column as a UTC-midnight Date, so slicing the
 * ISO string is exact and avoids shipping a timestamp for a calendar date.
 */
function toIsoDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

/** Row -> wire shape. Timestamps and dates are serialized here, once. */
function toDiscoveryOutput(row: Discovery): DiscoveryOutput {
  return {
    id: row.id,
    name: row.name,
    leadName: row.leadName,
    type: row.type,
    startDate: toIsoDate(row.startDate),
    ...(row.endDate === null ? {} : { endDate: toIsoDate(row.endDate) }),
    status: row.status,
    createdByUserId: row.createdByUserId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    deletedAt: row.deletedAt === null ? null : row.deletedAt.toISOString(),
  };
}

function toDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

/** An omitted optional field stays omitted; `undefined` is never passed down. */
function toUpdateData(input: DiscoveryUpdateInput): DiscoveryUpdateData {
  return {
    ...(input.name === undefined ? {} : { name: input.name }),
    ...(input.leadName === undefined ? {} : { leadName: input.leadName }),
    ...(input.type === undefined ? {} : { type: input.type }),
    ...(input.status === undefined ? {} : { status: input.status }),
    ...(input.startDate === undefined
      ? {}
      : { startDate: toDate(input.startDate) }),
    ...(input.endDate === undefined ? {} : { endDate: toDate(input.endDate) }),
  };
}

export async function create(
  userId: string,
  userName: string,
  input: DiscoveryCreateInput,
): Promise<DiscoveryOutput> {
  const created = await repo.create(db, {
    // The caller is always the owner; a client cannot set this.
    createdByUserId: userId,
    name: input.name,
    // Lead is free text defaulting to the creator's display name.
    leadName: input.leadName ?? userName,
    type: input.type,
    status: 'draft',
    startDate: toDate(input.startDate),
    endDate: input.endDate === undefined ? null : toDate(input.endDate),
  });

  return toDiscoveryOutput(created);
}

export async function getById(
  userId: string,
  id: string,
): Promise<DiscoveryOutput> {
  const row = await repo.findById(db, id, userId);

  if (row === null) {
    throw notFound('Discovery not found');
  }

  return toDiscoveryOutput(row);
}

export async function list(
  userId: string,
  query: DiscoveryListQuery,
): Promise<{
  items: DiscoveryOutput[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  const { items, total } = await repo.list(db, userId, {
    status: query.status,
    search: query.search,
    sort: query.sort,
    order: query.order,
    page: query.page,
    limit: query.limit,
  });

  return {
    items: items.map(toDiscoveryOutput),
    total,
    page: query.page,
    limit: query.limit,
    totalPages: Math.ceil(total / query.limit),
  };
}

/**
 * The range rule spans the patch and the persisted row, which a Zod schema over
 * the payload alone cannot see: PATCHing `endDate` earlier than the stored
 * `startDate` is only detectable once both halves are known. Lexicographic
 * comparison is exact for YYYY-MM-DD; a null end date means "no range".
 */
function assertChronologicalRange(
  current: Discovery,
  input: DiscoveryUpdateInput,
): void {
  const startDate = input.startDate ?? toIsoDate(current.startDate);
  const endDate =
    input.endDate ??
    (current.endDate === null ? null : toIsoDate(current.endDate));

  if (endDate !== null && endDate < startDate) {
    throw badRequest('endDate must be on or after startDate', {
      field: 'endDate',
    });
  }
}

/**
 * A row owned by somebody else is indistinguishable from a missing one: the
 * repo's scoped update matches nothing and both cases answer 404, never 403.
 */
export async function update(
  userId: string,
  id: string,
  input: DiscoveryUpdateInput,
): Promise<DiscoveryOutput> {
  // Read first so the range check can compare the patch against stored values.
  const current = await repo.findById(db, id, userId);

  if (current === null) {
    throw notFound('Discovery not found');
  }

  assertChronologicalRange(current, input);

  const updated = await repo.update(db, id, userId, toUpdateData(input));

  if (updated === null) {
    throw notFound('Discovery not found');
  }

  return toDiscoveryOutput(updated);
}

export async function remove(userId: string, id: string): Promise<void> {
  const deleted = await repo.softDelete(db, id, userId);

  if (!deleted) {
    throw notFound('Discovery not found');
  }
}
