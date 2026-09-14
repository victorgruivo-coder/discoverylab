import {
  discoveryCreateInput,
  type DiscoveryCreateInput,
} from '@discoverylab/shared';

/**
 * Temporary placeholder: the M1 `okSchema`/`Ok` exports were removed in
 * Milestone 2, and the Vite entry point only lands in Milestone 9.
 */
export function parseDiscoveryDraft(value: unknown): DiscoveryCreateInput {
  return discoveryCreateInput.parse(value);
}
