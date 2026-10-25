import { useMutation } from '@tanstack/react-query';
import { AlertCircle, Download, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { getApiErrorMessage } from '@/lib/api-client';

import { fetchDiscoveryExport } from './api';

/** Characters that browsers or operating systems reject in a download name. */
const INVALID_FILENAME_CHARACTERS = /[\\/:*?"<>|\p{Cc}]/gu;

function markdownFileName(discoveryName: string): string {
  const base = discoveryName
    .replace(INVALID_FILENAME_CHARACTERS, '-')
    .replace(/\s+/g, ' ')
    .trim();

  return `${base === '' ? 'discovery' : base}.md`;
}

/** Keeps the download client-side: no extra dependency and no navigation. */
function downloadMarkdown(markdown: string, discoveryName: string): void {
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = markdownFileName(discoveryName);
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/**
 * The export endpoint returns the document in the JSON body, so the browser
 * download is assembled here. The mutation keeps the button busy until the
 * fetch finishes and surfaces failures without leaving the workspace.
 */
export function ExportDiscoveryButton({
  discoveryId,
  discoveryName,
}: {
  discoveryId: string;
  discoveryName: string;
}) {
  const exportMutation = useMutation({
    mutationFn: () => fetchDiscoveryExport(discoveryId),
    onSuccess: ({ markdown }) => {
      downloadMarkdown(markdown, discoveryName);
    },
  });

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          exportMutation.mutate();
        }}
        disabled={exportMutation.isPending}
        aria-busy={exportMutation.isPending}
      >
        {exportMutation.isPending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <Download className="size-4" aria-hidden="true" />
        )}
        {exportMutation.isPending ? 'Exporting…' : 'Export'}
      </Button>

      {exportMutation.isError ? (
        <p
          role="alert"
          className="flex max-w-56 items-start gap-1 text-right text-xs text-red-600"
        >
          <AlertCircle
            className="mt-0.5 size-3.5 shrink-0"
            aria-hidden="true"
          />
          {getApiErrorMessage(exportMutation.error)}
        </p>
      ) : null}
    </div>
  );
}
