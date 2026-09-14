import { z } from 'zod';

import { nonEmptyString, uuid } from '../common.js';

/**
 * RICE (Prioritize): many rows per discovery.
 * `effort` must be positive; the score divides by it.
 */
export const riceEntry = z.object({
  id: uuid.optional(),
  opportunityName: nonEmptyString,
  reach: z.number().nonnegative(),
  impact: z.number().min(1).max(3),
  confidence: z.number().min(0).max(1),
  effort: z.number().positive(),
});
export type RiceEntry = z.infer<typeof riceEntry>;

export const riceContent = z.array(riceEntry);
export type RiceContent = z.infer<typeof riceContent>;

/**
 * (reach * impact * confidence) / effort, rounded to 2 decimals.
 * Defensive: the schema rejects effort <= 0, and a non-positive effort still
 * scores 0 rather than returning Infinity/NaN.
 */
export function computeRiceScore(entry: RiceEntry): number {
  if (entry.effort <= 0) {
    return 0;
  }

  const score = (entry.reach * entry.impact * entry.confidence) / entry.effort;

  return Math.round(score * 100) / 100;
}
