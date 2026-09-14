import { okSchema, type Ok } from '@discoverylab/shared';

/** Placeholder export; replaced by the Vite entry point in a later milestone. */
export function createInitialState(): Ok {
  return okSchema.parse({ ok: false });
}
