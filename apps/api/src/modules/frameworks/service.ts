import { computeRiceScore } from '@discoverylab/shared';

import * as repo from './repo.js';
import {
  frameworkKey as frameworkKeySchema,
  parseStoredContent,
} from './schemas.js';
import { db } from '../../db.js';
import { getById as getOwnedDiscovery } from '../discoveries/service.js';

import type {
  FrameworkContentInput,
  FrameworkContentStored,
  FrameworkInstanceOutput,
  FrameworkKey,
} from './schemas.js';
import type { FrameworkInstance } from '../../generated/prisma/client.js';

// Business logic only: no HTTP, no SQL.

/**
 * Reuses the discoveries service as the single ownership gate: it answers 404
 * for missing, foreign, and soft-deleted discoveries alike. Returning null
 * rather than throwing here would duplicate that rule in every endpoint.
 */
async function assertDiscoveryOwned(
  userId: string,
  discoveryId: string,
): Promise<void> {
  await getOwnedDiscovery(userId, discoveryId);
}

/**
 * RICE is the only framework with derived data. The score is computed here, not
 * in the browser, so every write stores the same number regardless of client.
 */
const contentPreparers: {
  [K in FrameworkKey]: (
    content: FrameworkContentInput[K],
  ) => FrameworkContentStored[K];
} = {
  'problem-statement': (content) => content,
  jtbd: (content) => content,
  ost: (content) => content,
  rice: (content) =>
    content.map((entry) => ({
      ...entry,
      score: computeRiceScore(entry),
    })),
  'decision-log': (content) => content,
};

function prepareContent<K extends FrameworkKey>(
  key: K,
  content: FrameworkContentInput[K],
): FrameworkContentStored[K] {
  return contentPreparers[key](content);
}

/**
 * Row -> wire shape. The switch keeps each branch's content under its own
 * literal key, so the discriminated output union stays correlated.
 */
function toOutput(row: FrameworkInstance): FrameworkInstanceOutput {
  const key = frameworkKeySchema.parse(row.frameworkKey);
  const base = {
    id: row.id,
    discoveryId: row.discoveryId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };

  switch (key) {
    case 'problem-statement':
      return {
        ...base,
        frameworkKey: key,
        content: parseStoredContent(key, row.content),
      };
    case 'jtbd':
      return {
        ...base,
        frameworkKey: key,
        content: parseStoredContent(key, row.content),
      };
    case 'ost':
      return {
        ...base,
        frameworkKey: key,
        content: parseStoredContent(key, row.content),
      };
    case 'rice':
      return {
        ...base,
        frameworkKey: key,
        content: parseStoredContent(key, row.content),
      };
    case 'decision-log':
      return {
        ...base,
        frameworkKey: key,
        content: parseStoredContent(key, row.content),
      };
  }
}

/** Null means "no saved content yet"; the route turns that into a 404. */
export async function get(
  userId: string,
  discoveryId: string,
  key: FrameworkKey,
): Promise<FrameworkInstanceOutput | null> {
  await assertDiscoveryOwned(userId, discoveryId);

  const row = await repo.findByDiscoveryAndKey(db, discoveryId, key);

  return row === null ? null : toOutput(row);
}

export async function list(
  userId: string,
  discoveryId: string,
): Promise<FrameworkInstanceOutput[]> {
  await assertDiscoveryOwned(userId, discoveryId);

  const rows = await repo.listByDiscovery(db, discoveryId);

  return rows.map(toOutput);
}

export async function upsert<K extends FrameworkKey>(
  userId: string,
  discoveryId: string,
  key: K,
  content: FrameworkContentInput[K],
): Promise<FrameworkInstanceOutput> {
  await assertDiscoveryOwned(userId, discoveryId);

  const stored = prepareContent(key, content);
  const row = await repo.upsert(db, discoveryId, key, stored);

  return toOutput(row);
}
