import { useQuery } from '@tanstack/react-query';
import { AlertCircle, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { getApiErrorMessage } from '@/lib/api-client';

import {
  fetchFramework,
  workspaceKeys,
  type FrameworkContentByKey,
  type FrameworkKey,
} from './api';

import type { ReactNode } from 'react';

type FrameworkFormStateProps<K extends FrameworkKey> = {
  discoveryId: string;
  frameworkKey: K;
  loadingLabel: string;
  errorTitle: string;
  skeletonRows?: number;
  children: (content: FrameworkContentByKey[K] | null) => ReactNode;
};

/**
 * Loads one framework and renders the skeleton, the retryable error panel, or
 * the form itself. A 404 surfaces as `null`, which means "nothing saved yet".
 */
export function FrameworkFormState<K extends FrameworkKey>({
  discoveryId,
  frameworkKey,
  loadingLabel,
  errorTitle,
  skeletonRows = 2,
  children,
}: FrameworkFormStateProps<K>) {
  const frameworkQuery = useQuery({
    queryKey: workspaceKeys.framework(discoveryId, frameworkKey),
    queryFn: () => fetchFramework(discoveryId, frameworkKey),
  });

  if (frameworkQuery.isPending) {
    return <FrameworkSkeleton label={loadingLabel} rows={skeletonRows} />;
  }

  if (frameworkQuery.isError) {
    return (
      <div
        role="alert"
        className="flex flex-wrap items-center gap-4 rounded-xl border border-red-200 bg-red-50 p-4"
      >
        <AlertCircle
          className="size-5 shrink-0 text-red-600"
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-red-800">{errorTitle}</p>
          <p className="mt-0.5 text-sm text-red-700">
            {getApiErrorMessage(frameworkQuery.error)}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            void frameworkQuery.refetch();
          }}
        >
          <RefreshCw className="size-3.5" aria-hidden="true" />
          Try again
        </Button>
      </div>
    );
  }

  return <>{children(frameworkQuery.data?.content ?? null)}</>;
}

function FrameworkSkeleton({ label, rows }: { label: string; rows: number }) {
  return (
    <div
      role="status"
      aria-label={label}
      className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="space-y-5">
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} className="space-y-2">
            <div className="h-3.5 w-32 animate-pulse rounded bg-slate-200" />
            <div className="h-24 animate-pulse rounded-lg bg-slate-100" />
          </div>
        ))}
      </div>
      <span className="sr-only">Loading {label.toLowerCase()}…</span>
    </div>
  );
}
