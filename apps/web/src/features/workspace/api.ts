import type {
  DecisionLogContent,
  DiscoveryOutput,
  DiscoveryStatus,
  IsoDateTime,
  JtbdContent,
  OstContent,
  ProblemStatementContent,
  RiceContent,
  Uuid,
} from '@discoverylab/shared';

import { ApiError, api } from '@/lib/api-client';

export const PROBLEM_STATEMENT_KEY = 'problem-statement' as const;
export const JTBD_KEY = 'jtbd' as const;
export const OST_KEY = 'ost' as const;
export const RICE_KEY = 'rice' as const;
export const DECISION_LOG_KEY = 'decision-log' as const;

export type FrameworkKey =
  | typeof PROBLEM_STATEMENT_KEY
  | typeof JTBD_KEY
  | typeof OST_KEY
  | typeof RICE_KEY
  | typeof DECISION_LOG_KEY;

/** Content as the client sends it, before the API adds derived RICE scores. */
export type FrameworkContentByKey = {
  'problem-statement': ProblemStatementContent;
  jtbd: JtbdContent;
  ost: OstContent;
  rice: RiceContent;
  'decision-log': DecisionLogContent;
};

/** The API's framework instance wire shape, discriminated by framework key. */
export type FrameworkInstance<K extends FrameworkKey = FrameworkKey> = {
  id: Uuid;
  discoveryId: Uuid;
  frameworkKey: K;
  content: FrameworkContentByKey[K];
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
};

export type ProblemStatementFramework = FrameworkInstance<
  typeof PROBLEM_STATEMENT_KEY
>;

export const workspaceKeys = {
  all: ['workspace'] as const,
  discovery: (discoveryId: string) =>
    [...workspaceKeys.all, 'discovery', discoveryId] as const,
  framework: (discoveryId: string, frameworkKey: FrameworkKey) =>
    [...workspaceKeys.all, 'framework', discoveryId, frameworkKey] as const,
};

function frameworkPath(
  discoveryId: string,
  frameworkKey: FrameworkKey,
): string {
  return `/discoveries/${encodeURIComponent(discoveryId)}/frameworks/${frameworkKey}`;
}

export function fetchDiscovery(discoveryId: string): Promise<DiscoveryOutput> {
  return api.get<DiscoveryOutput>(
    `/discoveries/${encodeURIComponent(discoveryId)}`,
  );
}

/** PATCH only the lifecycle status; the API returns the updated discovery. */
export function updateDiscoveryStatus(
  discoveryId: string,
  status: DiscoveryStatus,
): Promise<DiscoveryOutput> {
  return api.patch<DiscoveryOutput>(
    `/discoveries/${encodeURIComponent(discoveryId)}`,
    { status },
  );
}

/** Soft-deletes the discovery (204 No Content). */
export function deleteDiscovery(discoveryId: string): Promise<void> {
  return api.delete<void>(`/discoveries/${encodeURIComponent(discoveryId)}`);
}

/**
 * A missing framework row is the API's normal "nothing saved yet" answer (404),
 * not a failure. Everything else propagates so the query can surface it.
 */
export async function fetchFramework<K extends FrameworkKey>(
  discoveryId: string,
  frameworkKey: K,
): Promise<FrameworkInstance<K> | null> {
  try {
    return await api.get<FrameworkInstance<K>>(
      frameworkPath(discoveryId, frameworkKey),
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }

    throw error;
  }
}

export function saveFramework<K extends FrameworkKey>(
  discoveryId: string,
  frameworkKey: K,
  content: FrameworkContentByKey[K],
): Promise<FrameworkInstance<K>> {
  return api.put<FrameworkInstance<K>>(
    frameworkPath(discoveryId, frameworkKey),
    { content },
  );
}

/** Thin Problem Statement wrappers kept so the existing form stays unchanged. */
export async function fetchProblemStatement(
  discoveryId: string,
): Promise<ProblemStatementFramework | null> {
  return fetchFramework(discoveryId, PROBLEM_STATEMENT_KEY);
}

export function saveProblemStatement(
  discoveryId: string,
  content: ProblemStatementContent,
): Promise<ProblemStatementFramework> {
  return saveFramework(discoveryId, PROBLEM_STATEMENT_KEY, content);
}
