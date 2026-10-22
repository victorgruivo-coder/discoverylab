import { useQuery } from '@tanstack/react-query';
import { AlertCircle, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { getApiErrorMessage } from '@/lib/api-client';

import {
  PROBLEM_STATEMENT_KEY,
  fetchProblemStatement,
  workspaceKeys,
} from './api';
import { ProblemStatementFields } from './ProblemStatementFields';
import { ProblemStatementSkeleton } from './ProblemStatementSkeleton';

export function ProblemStatementForm({ discoveryId }: { discoveryId: string }) {
  const frameworkQuery = useQuery({
    queryKey: workspaceKeys.framework(discoveryId, PROBLEM_STATEMENT_KEY),
    queryFn: () => fetchProblemStatement(discoveryId),
  });

  if (frameworkQuery.isPending) {
    return <ProblemStatementSkeleton />;
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
          <p className="text-sm font-medium text-red-800">
            Could not load the problem statement
          </p>
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

  return (
    <ProblemStatementFields
      discoveryId={discoveryId}
      initialContent={frameworkQuery.data?.content ?? null}
    />
  );
}
