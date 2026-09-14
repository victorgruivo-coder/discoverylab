import { z } from 'zod';

/**
 * These `as const` arrays are the single source of truth for enum values:
 * Milestone 3 references the same literal unions in the Prisma schema.
 */
export const DISCOVERY_STATUSES = [
  'draft',
  'active',
  'completed',
  'archived',
] as const;
export const discoveryStatus = z.enum(DISCOVERY_STATUSES);
export type DiscoveryStatus = z.infer<typeof discoveryStatus>;

export const DISCOVERY_TYPES = [
  'feature',
  'product',
  'growth',
  'other',
] as const;
export const discoveryType = z.enum(DISCOVERY_TYPES);
export type DiscoveryType = z.infer<typeof discoveryType>;

export const STAGES = [
  'frame',
  'understand',
  'explore',
  'prioritize',
  'decide',
] as const;
export const stage = z.enum(STAGES);
export type Stage = z.infer<typeof stage>;

export const OST_NODE_TYPES = [
  'outcome',
  'opportunity',
  'solution',
  'experiment',
] as const;
export const ostNodeType = z.enum(OST_NODE_TYPES);
export type OstNodeType = z.infer<typeof ostNodeType>;
