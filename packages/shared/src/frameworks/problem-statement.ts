import { z } from 'zod';

import { nonEmptyString, optionalText } from '../common.js';

/** Problem Statement (Frame): exactly one per discovery. */
export const problemStatementContent = z.object({
  problem: nonEmptyString,
  whoIsAffected: optionalText,
  whyNow: optionalText,
  constraints: optionalText,
  successCriteria: optionalText,
});
export type ProblemStatementContent = z.infer<typeof problemStatementContent>;
