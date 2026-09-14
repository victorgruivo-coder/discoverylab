import { z } from 'zod';

import { nonEmptyString, optionalText, uuid } from '../common.js';
import { ostNodeType } from '../enums.js';

/**
 * Opportunity Solution Tree (Explore): one tree per discovery.
 * The root is the single node whose type is 'outcome' and whose parentId is
 * null; every other node points at its parent by id.
 */
export const ostNode = z.object({
  id: uuid.optional(),
  title: nonEmptyString,
  type: ostNodeType,
  parentId: uuid.nullable().optional(),
  notes: optionalText,
});
export type OstNode = z.infer<typeof ostNode>;

export const ostContent = z.object({ nodes: z.array(ostNode) });
export type OstContent = z.infer<typeof ostContent>;
