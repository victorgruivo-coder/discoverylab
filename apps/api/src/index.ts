import { computeRiceScore, discoveryCreateInput } from '@discoverylab/shared';

/**
 * Temporary Milestone 2 probe: proves that schemas and pure helpers resolve and
 * typecheck across the workspace. Replace with the Fastify bootstrap in M4.
 */
export function probeSharedPackage() {
  const input = discoveryCreateInput.parse({
    name: 'Checkout drop-off',
    startDate: '2026-09-01',
  });

  const score = computeRiceScore({
    opportunityName: 'One-tap checkout',
    reach: 1200,
    impact: 3,
    confidence: 0.8,
    effort: 4,
  });

  return { input, score };
}
