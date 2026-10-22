import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Loader2 } from 'lucide-react';

import { DISCOVERY_STATUSES, type DiscoveryStatus } from '@discoverylab/shared';

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { discoveryKeys } from '@/features/discoveries/api';
import { getApiErrorMessage } from '@/lib/api-client';
import { formatEnumLabel } from '@/lib/format';

import { updateDiscoveryStatus, workspaceKeys } from './api';

/**
 * Status is patched from the header. The server echo replaces the cached
 * discovery, so the title area and dashboard badge stay in sync immediately.
 */
export function DiscoveryStatusSelect({
  discoveryId,
  status,
}: {
  discoveryId: string;
  status: DiscoveryStatus;
}) {
  const queryClient = useQueryClient();

  const statusMutation = useMutation({
    mutationFn: (nextStatus: DiscoveryStatus) =>
      updateDiscoveryStatus(discoveryId, nextStatus),
    onSuccess: (updated) => {
      queryClient.setQueryData(workspaceKeys.discovery(discoveryId), updated);
      void queryClient.invalidateQueries({ queryKey: discoveryKeys.all });
    },
  });

  const selectStatus = (value: string): void => {
    const nextStatus = DISCOVERY_STATUSES.find((option) => option === value);

    if (nextStatus === undefined || nextStatus === status) {
      return;
    }

    statusMutation.mutate(nextStatus);
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <Label
          htmlFor="discovery-status"
          className="text-xs font-medium text-slate-500"
        >
          Status
        </Label>

        <Select
          value={status}
          onValueChange={selectStatus}
          disabled={statusMutation.isPending}
        >
          <SelectTrigger
            id="discovery-status"
            className="w-32 bg-white"
            aria-label="Discovery status"
          >
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {DISCOVERY_STATUSES.map((option) => (
              <SelectItem key={option} value={option}>
                {formatEnumLabel(option)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {statusMutation.isPending ? (
          <Loader2
            className="size-4 animate-spin text-slate-400"
            aria-hidden="true"
          />
        ) : null}
      </div>

      {statusMutation.isError ? (
        <p
          role="alert"
          className="inline-flex items-center gap-1 text-xs text-red-600"
        >
          <AlertCircle className="size-3.5" aria-hidden="true" />
          {getApiErrorMessage(statusMutation.error)}
        </p>
      ) : null}
    </div>
  );
}
