import { AlertCircle, Check, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

import type { FormEventHandler, ReactNode } from 'react';

type FrameworkFormShellProps = {
  headingId: string;
  stageLabel: string;
  title: string;
  description: string;
  isDirty: boolean;
  isSaving: boolean;
  isError: boolean;
  isSaved: boolean;
  errorMessage: string | undefined;
  onSubmit: FormEventHandler<HTMLFormElement>;
  children: ReactNode;
};

/**
 * Shared chrome for the list-based framework forms: heading, save state, and
 * the single Save button. Keeping it in one place means every stage reports
 * saved/unsaved/error the same way as the Problem Statement.
 */
export function FrameworkFormShell({
  headingId,
  stageLabel,
  title,
  description,
  isDirty,
  isSaving,
  isError,
  isSaved,
  errorMessage,
  onSubmit,
  children,
}: FrameworkFormShellProps) {
  return (
    <form
      noValidate
      aria-labelledby={headingId}
      className="rounded-xl border border-slate-200 bg-white shadow-sm"
      onSubmit={onSubmit}
    >
      <div className="border-b border-slate-100 px-6 py-5">
        <p className="text-xs font-medium tracking-wider text-slate-500 uppercase">
          {stageLabel}
        </p>
        <h2
          id={headingId}
          className="mt-1 text-lg font-semibold tracking-tight text-slate-900"
        >
          {title}
        </h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>

      <div className="space-y-5 px-6 py-6">{children}</div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-6 py-4">
        <div className="min-h-5 text-sm" aria-live="polite">
          {isError ? (
            <p
              role="alert"
              className="inline-flex items-center gap-1.5 text-red-600"
            >
              <AlertCircle className="size-4" aria-hidden="true" />
              {errorMessage ?? 'Could not save. Please try again.'}
            </p>
          ) : isDirty ? (
            <p className="text-slate-500">Unsaved changes</p>
          ) : isSaved ? (
            <p
              role="status"
              className="inline-flex items-center gap-1.5 text-emerald-700"
            >
              <Check className="size-4" aria-hidden="true" />
              Saved
            </p>
          ) : null}
        </div>

        <Button type="submit" disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : null}
          {isSaving ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </form>
  );
}
