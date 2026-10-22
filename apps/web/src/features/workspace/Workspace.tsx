import { useQuery } from '@tanstack/react-query';
import { AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { getApiErrorMessage } from '@/lib/api-client';

import { fetchDiscovery, workspaceKeys } from './api';
import { DecisionLogForm } from './DecisionLogForm';
import { DeleteDiscoveryDialog } from './DeleteDiscoveryDialog';
import { DiscoveryStatusSelect } from './DiscoveryStatusSelect';
import { JtbdForm } from './JtbdForm';
import { OstForm } from './OstForm';
import { ProblemStatementForm } from './ProblemStatementForm';
import { RiceForm } from './RiceForm';
import { StageNav } from './StageNav';
import { getActiveStage } from './stages';

import type { StageKey } from './stages';

export function Workspace() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const activeStage = getActiveStage(searchParams);
  const discoveryId = id ?? '';

  const discoveryQuery = useQuery({
    queryKey: workspaceKeys.discovery(discoveryId),
    queryFn: () => fetchDiscovery(discoveryId),
    enabled: discoveryId !== '',
  });

  if (discoveryId === '') {
    return <MissingDiscovery />;
  }

  const discovery = discoveryQuery.data;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <header className="flex shrink-0 flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium tracking-wider text-slate-500 uppercase">
            Discovery
          </p>

          {discoveryQuery.isPending ? (
            <div
              className="mt-2 h-8 w-64 max-w-full animate-pulse rounded bg-slate-200"
              role="status"
              aria-label="Loading discovery"
            />
          ) : (
            <h1 className="mt-1 truncate text-2xl font-semibold tracking-tight text-slate-900">
              {discovery?.name ?? 'Discovery unavailable'}
            </h1>
          )}
        </div>

        <div className="flex flex-wrap items-start justify-end gap-2">
          {discovery ? (
            <>
              <DiscoveryStatusSelect
                discoveryId={discovery.id}
                status={discovery.status}
              />
              <DeleteDiscoveryDialog
                discoveryId={discovery.id}
                discoveryName={discovery.name}
              />
            </>
          ) : null}

          <Button asChild variant="outline">
            <Link to="/">
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </header>

      <div className="mt-6 grid min-h-0 flex-1 gap-6 overflow-y-auto overscroll-contain lg:grid-cols-[200px_minmax(0,1fr)] lg:overflow-hidden">
        <StageNav />

        <div className="min-w-0 overscroll-contain lg:min-h-0 lg:overflow-y-auto lg:pr-1">
          {discoveryQuery.isPending ? <WorkspaceSkeleton /> : null}

          {discoveryQuery.isError ? (
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
                  Could not load this discovery
                </p>
                <p className="mt-0.5 text-sm text-red-700">
                  {getApiErrorMessage(discoveryQuery.error)}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  void discoveryQuery.refetch();
                }}
              >
                <RefreshCw className="size-3.5" aria-hidden="true" />
                Try again
              </Button>
            </div>
          ) : null}

          {discoveryQuery.isSuccess ? (
            <StageForm stage={activeStage} discoveryId={discoveryId} />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function StageForm({
  stage,
  discoveryId,
}: {
  stage: StageKey;
  discoveryId: string;
}) {
  switch (stage) {
    case 'problem-statement':
      return <ProblemStatementForm discoveryId={discoveryId} />;
    case 'jtbd':
      return <JtbdForm discoveryId={discoveryId} />;
    case 'ost':
      return <OstForm discoveryId={discoveryId} />;
    case 'rice':
      return <RiceForm discoveryId={discoveryId} />;
    case 'decision-log':
      return <DecisionLogForm discoveryId={discoveryId} />;
  }
}

function WorkspaceSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading discovery workspace"
      className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="h-5 w-40 animate-pulse rounded bg-slate-200" />
      <div className="mt-2 h-3.5 w-72 max-w-full animate-pulse rounded bg-slate-100" />

      <div className="mt-6 space-y-5">
        {[0, 1, 2].map((index) => (
          <div key={index} className="space-y-2">
            <div className="h-3.5 w-32 animate-pulse rounded bg-slate-200" />
            <div className="h-24 animate-pulse rounded-lg bg-slate-100" />
          </div>
        ))}
      </div>

      <span className="sr-only">Loading discovery…</span>
    </div>
  );
}

function MissingDiscovery() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
        Discovery not found
      </h1>
      <p className="text-sm text-slate-500">
        This discovery URL is missing an id, so there is nothing to open.
      </p>
      <Button asChild variant="outline">
        <Link to="/">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to Dashboard
        </Link>
      </Button>
    </div>
  );
}
