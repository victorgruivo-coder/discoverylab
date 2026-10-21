import type {
  DiscoveryCreateInput,
  DiscoveryOutput,
} from '@discoverylab/shared';

import { api } from '@/lib/api-client';

/** Shape returned by `GET /api/v1/discoveries` (offset pagination). */
export type DiscoveryListResponse = {
  items: DiscoveryOutput[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export const discoveryKeys = {
  all: ['discoveries'] as const,
  list: () => [...discoveryKeys.all, 'list'] as const,
};

export function fetchDiscoveries(): Promise<DiscoveryListResponse> {
  // v1 dashboards are small; request the API's maximum page size instead of
  // introducing pagination UI before the wizard milestone needs it.
  return api.get<DiscoveryListResponse>('/discoveries?limit=100');
}

export function createDiscovery(
  input: DiscoveryCreateInput,
): Promise<DiscoveryOutput> {
  return api.post<DiscoveryOutput>('/discoveries', input);
}
