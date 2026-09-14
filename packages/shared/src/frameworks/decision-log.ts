import { z } from 'zod';

import { isoDate, nonEmptyString, optionalText, uuid } from '../common.js';

/** Decision Log (Decide): many entries per discovery. */
export const decisionEntry = z.object({
  id: uuid.optional(),
  decision: nonEmptyString,
  rationale: optionalText,
  decidedAt: isoDate.optional(),
  owner: optionalText,
});
export type DecisionEntry = z.infer<typeof decisionEntry>;

export const decisionLogContent = z.array(decisionEntry);
export type DecisionLogContent = z.infer<typeof decisionLogContent>;
