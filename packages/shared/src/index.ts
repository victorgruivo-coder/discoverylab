import { z } from 'zod';

/** Placeholder constant; replaced by real exports in later milestones. */
export const SHARED_PACKAGE_NAME = '@discoverylab/shared';

/** Placeholder schema proving the Zod boundary type-checks across packages. */
export const okSchema = z.object({ ok: z.boolean() });

export type Ok = z.infer<typeof okSchema>;
