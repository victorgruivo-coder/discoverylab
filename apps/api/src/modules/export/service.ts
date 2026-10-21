import { formatDiscoveryMarkdown } from './formatter.js';
import { db } from '../../db.js';
import { getById as getOwnedDiscovery } from '../discoveries/service.js';
import * as frameworkRepo from '../frameworks/repo.js';

// Business logic only: no HTTP, no SQL.

export type ExportResult = {
  markdown: string;
};

/**
 * Ownership is enforced by the discoveries service, which treats missing,
 * foreign, and soft-deleted rows as the same 404. Framework rows are then read
 * by discovery id; the service never sees a path a caller could use to reach
 * somebody else's data.
 */
export async function getExport(
  userId: string,
  discoveryId: string,
): Promise<ExportResult> {
  const discovery = await getOwnedDiscovery(userId, discoveryId);
  const frameworks = await frameworkRepo.listByDiscovery(db, discoveryId);

  return {
    markdown: formatDiscoveryMarkdown(discovery, frameworks),
  };
}
