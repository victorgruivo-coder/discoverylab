import type {
  DiscoveryOutput,
  IsoDateTime,
  ProblemStatementContent,
  Uuid,
} from '@discoverylab/shared';

import { ApiError, api } from '@/lib/api-client';

export const PROBLEM_STATEMENT_KEY = 'problem-statement' as const;

/**
 * The API's framework instance wire shape for this milestone. Only the Problem
 * Statement is consumed here; the other four stages are placeholders for now.
 */
export type ProblemStatementFramework = {
  id: Uuid;
  discoveryId: Uuid;
  frameworkKey: typeof PROBLEM_STATEMENT_KEY;
  content: ProblemStatementContent;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
};

export const workspaceKeys = {
  all: ['workspace'] as const,
  discovery: (discoveryId: string) =>
    [...workspaceKeys.all, 'discovery', discoveryId] as const,
  framework: (discoveryId: string, frameworkKey: string) =>
    [...workspaceKeys.all, 'framework', discoveryId, frameworkKey] as const,
};

export function fetchDiscovery(discoveryId: string): Promise<DiscoveryOutput> {
  return api.get<DiscoveryOutput>(
    `/discoveries/${encodeURIComponent(discoveryId)}`,
  );
}

/**
 * A missing framework row is the API's normal "nothing saved yet" answer (404),
 * not a failure. Everything else propagates so the query can surface it.
 */
export async function fetchProblemStatement(
  discoveryId: string,
): Promise<ProblemStatementFramework | null> {
  try {
    return await api.get<ProblemStatementFramework>(
      `/discoveries/${encodeURIComponent(discoveryId)}/frameworks/${PROBLEM_STATEMENT_KEY}`,
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }

    throw error;
  }
}

export function saveProblemStatement(
  discoveryId: string,
  content: ProblemStatementContent,
): Promise<ProblemStatementFramework> {
  return api.put<ProblemStatementFramework>(
    `/discoveries/${encodeURIComponent(discoveryId)}/frameworks/${PROBLEM_STATEMENT_KEY}`,
    { content },
  );
}
