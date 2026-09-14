import { okSchema, type Ok } from '@discoverylab/shared';

/** Placeholder function; replaced by the Fastify bootstrap in a later milestone. */
export function createHealthPayload(): Ok {
  return okSchema.parse({ ok: true });
}
