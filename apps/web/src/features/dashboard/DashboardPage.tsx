import { useQuery } from '@tanstack/react-query';
import { AlertCircle, ArrowRight, Plus, RefreshCw } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/AuthContext';
import { discoveryKeys, fetchDiscoveries } from '@/features/discoveries/api';
import { CreateDiscoveryModal } from '@/features/discoveries/CreateDiscoveryModal';
import { DiscoveryCard } from '@/features/discoveries/DiscoveryCard';
import { getApiErrorMessage } from '@/lib/api-client';

import { RecentSkeleton, StatCard } from './DashboardCards';

const RECENT_LIMIT = 3;

export function DashboardPage() {
  const { user } = useAuth();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const discoveriesQuery = useQuery({
    queryKey: discoveryKeys.list(),
    queryFn: fetchDiscoveries,
  });

  const discoveries = discoveriesQuery.data?.items ?? [];
  const isPending = discoveriesQuery.isPending;

  const stats = [
    {
      label: 'Total Discoveries',
      value: discoveriesQuery.data?.total ?? discoveries.length,
    },
    {
      label: 'Active',
      value: discoveries.filter((discovery) => discovery.status === 'active')
        .length,
    },
    {
      label: 'Drafts',
      value: discoveries.filter((discovery) => discovery.status === 'draft')
        .length,
    },
  ];

  /** Most recent activity first, capped to the dashboard preview size. */
  const recentDiscoveries = useMemo(() => {
    const items = discoveriesQuery.data?.items ?? [];

    return [...items]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, RECENT_LIMIT);
  }, [discoveriesQuery.data]);

  const openCreate = useCallback(() => {
    setIsCreateOpen(true);
  }, []);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            Welcome back, {user?.name ?? 'there'}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Here is what is happening across your discovery work.
          </p>
        </div>

        <Button type="button" onClick={openCreate}>
          <Plus className="size-4" aria-hidden="true" />
          New discovery
        </Button>
      </header>

      <section aria-label="Discovery statistics">
        <div className="grid gap-4 sm:grid-cols-3">
          {stats.map((stat) => (
            <StatCard
              key={stat.label}
              label={stat.label}
              value={isPending ? null : stat.value}
            />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-slate-900">
              Recent Discoveries
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Your three most recently updated discoveries.
            </p>
          </div>

          <Link
            to="/discoveries"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
          >
            View all
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>

        {isPending ? <RecentSkeleton /> : null}

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

        {discoveriesQuery.isSuccess && recentDiscoveries.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
            <p className="text-sm font-medium text-slate-900">
              No discoveries yet
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Create your first discovery to see it here.
            </p>
            <Button
              type="button"
              size="sm"
              className="mt-4"
              onClick={openCreate}
            >
              <Plus className="size-3.5" aria-hidden="true" />
              New discovery
            </Button>
          </div>
        ) : null}

        {recentDiscoveries.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {recentDiscoveries.map((discovery) => (
              <DiscoveryCard key={discovery.id} discovery={discovery} compact />
            ))}
          </div>
        ) : null}
      </section>

      {isCreateOpen && (
        <CreateDiscoveryModal open onOpenChange={setIsCreateOpen} />
      )}
    </div>
  );
}
