import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Check, Loader2 } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';

import type { ProblemStatementContent } from '@discoverylab/shared';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { getApiErrorMessage } from '@/lib/api-client';

import {
  PROBLEM_STATEMENT_KEY,
  saveProblemStatement,
  workspaceKeys,
} from './api';
import {
  PROBLEM_STATEMENT_FIELDS,
  problemStatementResolver,
  toProblemStatementDefaults,
  type ProblemStatementFormOutput,
  type ProblemStatementFormValues,
} from './problemStatementForm';

export function ProblemStatementFields({
  discoveryId,
  initialContent,
}: {
  discoveryId: string;
  initialContent: ProblemStatementContent | null;
}) {
  const queryClient = useQueryClient();

  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm<ProblemStatementFormValues, unknown, ProblemStatementFormOutput>({
    resolver: problemStatementResolver,
    defaultValues: toProblemStatementDefaults(initialContent),
    mode: 'onSubmit',
  });

  const saveMutation = useMutation({
    mutationFn: (values: ProblemStatementFormOutput) =>
      saveProblemStatement(discoveryId, values),
    onSuccess: (saved) => {
      // Keep the cache in sync with the server's echo, then move the form's
      // dirty baseline so "Saved" replaces "Unsaved changes".
      queryClient.setQueryData(
        workspaceKeys.framework(discoveryId, PROBLEM_STATEMENT_KEY),
        saved,
      );
      reset(toProblemStatementDefaults(saved.content));
    },
  });

  const onSubmit = (values: ProblemStatementFormOutput): void => {
    saveMutation.mutate(values);
  };

  const submit = handleSubmit(onSubmit);
  const showSaved = saveMutation.isSuccess && !isDirty;

  return (
    <form
      noValidate
      aria-labelledby="problem-statement-heading"
      className="rounded-xl border border-slate-200 bg-white shadow-sm"
      onSubmit={(event) => {
        void submit(event);
      }}
    >
      <div className="border-b border-slate-100 px-6 py-5">
        <p className="text-xs font-medium tracking-wider text-slate-500 uppercase">
          Frame
        </p>
        <h2
          id="problem-statement-heading"
          className="mt-1 text-lg font-semibold tracking-tight text-slate-900"
        >
          Problem statement
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Agree on the problem before exploring solutions. Plain text is enough
          here.
        </p>
      </div>

      <div className="space-y-5 px-6 py-6">
        {PROBLEM_STATEMENT_FIELDS.map((config) => (
          <Controller
            key={config.name}
            control={control}
            name={config.name}
            render={({ field, fieldState }) => {
              const inputId = `problem-statement-${config.name}`;
              const helperId = `${inputId}-helper`;
              const errorId = `${inputId}-error`;

              return (
                <div className="space-y-1.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <Label htmlFor={inputId}>
                      {config.label}
                      {config.required ? (
                        <span className="text-red-600" aria-hidden="true">
                          *
                        </span>
                      ) : null}
                    </Label>
                    {config.required ? null : (
                      <span className="text-xs font-normal text-slate-400">
                        Optional
                      </span>
                    )}
                  </div>

                  <Textarea
                    {...field}
                    id={inputId}
                    value={field.value ?? ''}
                    placeholder={config.placeholder}
                    aria-required={config.required ? true : undefined}
                    aria-invalid={fieldState.invalid ? true : undefined}
                    aria-describedby={fieldState.error ? errorId : helperId}
                  />

                  {fieldState.error?.message ? (
                    <p id={errorId} className="text-xs text-red-600">
                      {fieldState.error.message}
                    </p>
                  ) : (
                    <p id={helperId} className="text-xs text-slate-500">
                      {config.helper}
                    </p>
                  )}
                </div>
              );
            }}
          />
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-6 py-4">
        <div className="min-h-5 text-sm" aria-live="polite">
          {saveMutation.isError ? (
            <p
              role="alert"
              className="inline-flex items-center gap-1.5 text-red-600"
            >
              <AlertCircle className="size-4" aria-hidden="true" />
              {getApiErrorMessage(saveMutation.error)}
            </p>
          ) : showSaved ? (
            <p
              role="status"
              className="inline-flex items-center gap-1.5 text-emerald-700"
            >
              <Check className="size-4" aria-hidden="true" />
              Saved
            </p>
          ) : isDirty ? (
            <p className="text-slate-500">Unsaved changes</p>
          ) : null}
        </div>

        <Button type="submit" disabled={saveMutation.isPending}>
          {saveMutation.isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : null}
          {saveMutation.isPending ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </form>
  );
}
