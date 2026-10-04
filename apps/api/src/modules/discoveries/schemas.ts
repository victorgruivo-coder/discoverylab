// HTTP-boundary shapes for discoveries. The shared package already owns the
// request and response schemas; this module re-exports them so the discoveries
// module imports from one place, and adds the query/param shapes that only the
// HTTP layer needs.
import { z } from 'zod';

import { discoveryStatus, uuid } from '@discoverylab/shared';

export {
  discoveryCreateInput,
  discoveryOutput,
  discoveryUpdateInput,
} from '@discoverylab/shared';
export type {
  DiscoveryCreateInput,
  DiscoveryOutput,
  DiscoveryUpdateInput,
} from '@discoverylab/shared';

/**
 * Offset pagination only: cursors are out of scope for v1. Sorting is limited
 * to updatedAt/createdAt/name — the columns the list view exposes.
 */
export const discoveryListQuery = z.object({
  status: discoveryStatus.optional(),
  search: z.string().trim().min(1).max(200).optional(),
  sort: z.enum(['updatedAt', 'createdAt', 'name']).default('updatedAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type DiscoveryListQuery = z.infer<typeof discoveryListQuery>;

/**
 * A non-UUID :id would otherwise reach Postgres and surface as a 500; the column
 * is `uuid`, so rejecting the shape at the boundary is cheaper.
 */
export const discoveryParams = z.object({ id: uuid });
export type DiscoveryParams = z.infer<typeof discoveryParams>;
