import { z } from 'zod';

import { nonEmptyString, optionalText, uuid } from '../common.js';

/** Jobs To Be Done (Understand): many entries per discovery. */
export const jtbdEntry = z.object({
  id: uuid.optional(),
  jobStatement: nonEmptyString,
  segment: optionalText,
  notes: optionalText,
});
export type JtbdEntry = z.infer<typeof jtbdEntry>;

export const jtbdContent = z.array(jtbdEntry);
export type JtbdContent = z.infer<typeof jtbdContent>;
