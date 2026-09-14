import { z } from 'zod';

import { isoDateTime, nonEmptyString, uuid } from './common.js';

/** Email + password signup. Verification and reset flows are deferred to v2. */
export const signupInput = z.object({
  name: nonEmptyString,
  email: z.string().email(),
  password: z.string().min(10).max(200),
});
export type SignupInput = z.infer<typeof signupInput>;

export const loginInput = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginInput>;

/** Never carries a password hash; this is the only user shape that leaves the API. */
export const userOutput = z.object({
  id: uuid,
  email: z.string().email(),
  name: nonEmptyString,
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
});
export type UserOutput = z.infer<typeof userOutput>;

/** Only the session id and expiry are exposed; the raw token lives in the cookie. */
export const sessionOutput = z.object({
  id: uuid,
  expiresAt: isoDateTime,
});
export type SessionOutput = z.infer<typeof sessionOutput>;
