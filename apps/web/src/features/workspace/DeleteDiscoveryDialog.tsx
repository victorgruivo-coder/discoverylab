import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { discoveryKeys } from '@/features/discoveries/api';
import { getApiErrorMessage } from '@/lib/api-client';

import { deleteDiscovery, workspaceKeys } from './api';

/**
 * Confirmation lives in an AlertDialog so a destructive action cannot happen
 * from a single stray click. The dialog stays open if the DELETE fails.
 */
export function DeleteDiscoveryDialog({
  discoveryId,
  discoveryName,
}: {
  discoveryId: string;
  discoveryName: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const deleteMutation = useMutation({
    mutationFn: () => deleteDiscovery(discoveryId),
    onSuccess: () => {
      setIsOpen(false);
      queryClient.removeQueries({ queryKey: workspaceKeys.all });
      void queryClient.invalidateQueries({ queryKey: discoveryKeys.all });
      void navigate('/discoveries');
    },
  });

  const handleOpenChange = (open: boolean): void => {
    setIsOpen(open);

    if (!open) {
      deleteMutation.reset();
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button type="button" variant="destructive">
          <Trash2 className="size-4" aria-hidden="true" />
          Delete
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this discovery?</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="font-medium text-slate-900">{discoveryName}</span>{' '}
            will be removed from your dashboard. Its framework content will no
            longer be accessible.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {deleteMutation.isError ? (
          <p
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
          >
            {getApiErrorMessage(deleteMutation.error)}
          </p>
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>
            Cancel
          </AlertDialogCancel>

          <AlertDialogAction
            className="bg-red-600 text-white hover:bg-red-700"
            disabled={deleteMutation.isPending}
            onClick={(event) => {
              // Keep the dialog open until DELETE succeeds (or shows an error).
              event.preventDefault();
              deleteMutation.mutate();
            }}
          >
            {deleteMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Trash2 className="size-4" aria-hidden="true" />
            )}
            {deleteMutation.isPending ? 'Deleting…' : 'Delete discovery'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
