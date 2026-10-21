import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Plus, RefreshCw } from 'lucide-react';
import { memo, useCallback, useState } from 'react';

import type { DiscoveryOutput } from '@discoverylab/shared';

import { Button } from '@/components/ui/button';
import { discoveryKeys, fetchDiscoveries } from '@/features/discoveries/api';
import { CreateDiscoveryModal } from '@/features/discoveries/CreateDiscoveryModal';
import { DiscoveryCard } from '@/features/discoveries/DiscoveryCard';
import { EmptyDiscoveries } from '@/features/discoveries/EmptyDiscoveries';
import { getApiErrorMessage } from '@/lib/api-client';

/**
 * The cards are the expensive part of this page. Memoizing the grid keeps an
 * unrelated state update (opening or closing the modal) from re-rendering the
 * whole list.
 */
const DiscoveryGrid = memo(function DiscoveryGrid({
  discoveries,
}: {
  discoveries: DiscoveryOutput[];
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {discoveries.map((discovery) => (
        <DiscoveryCard key={discovery.id} discovery={discovery} />
      ))}
    </div>
  );
});

export function Dashboard() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const discoveriesQuery = useQuery({
    queryKey: discoveryKeys.list(),
    queryFn: fetchDiscoveries,
  });

  const discoveries = discoveriesQuery.data?.items ?? [];

  const openCreate = useCallback(() => {
    setIsCreateOpen(true);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">
            Your discoveries
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Frame problems, explore opportunities, and decide what to build
            next.
          </p>
        </div>

        <Button type="button" onClick={openCreate}>
          <Plus className="size-4" aria-hidden="true" />
          New discovery
        </Button>
      </div>

      {discoveriesQuery.isPending ? <DashboardSkeleton /> : null}

      {discoveriesQuery.isError ? (
        <div
          role="alert"
          className="flex flex-wrap items-center gap-4 rounded-xl border border-red-200 bg-red-50 p-4"
        >
          <AlertCircle
            className="size-5 shrink-0 text-red-600"
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-red-800">
              Could not load your discoveries
            </p>
            <p className="mt-0.5 text-sm text-red-700">
              {getApiErrorMessage(discoveriesQuery.error)}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              void discoveriesQuery.refetch();
            }}
          >
            <RefreshCw className="size-3.5" aria-hidden="true" />
            Try again
          </Button>
        </div>
      ) : null}

      {discoveriesQuery.isSuccess && discoveries.length === 0 ? (
        <EmptyDiscoveries onCreate={openCreate} />
      ) : null}

      {discoveries.length > 0 ? (
        <DiscoveryGrid discoveries={discoveries} />
      ) : null}

      {isCreateOpen && (
        <CreateDiscoveryModal open onOpenChange={setIsCreateOpen} />
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
      role="status"
      aria-label="Loading discoveries"
    >
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className="h-40 animate-pulse rounded-xl border border-slate-200 bg-white"
          aria-hidden="true"
        />
      ))}
      <span className="sr-only">Loading discoveries…</span>
    </div>
  );
}
