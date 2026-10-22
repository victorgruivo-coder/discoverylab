import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';

import type { JtbdContent } from '@discoverylab/shared';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { getApiErrorMessage } from '@/lib/api-client';

import { JTBD_KEY, saveFramework, workspaceKeys } from './api';
import { FrameworkFormShell } from './FrameworkFormShell';
import { FrameworkFormState } from './FrameworkFormState';
import {
  JTBD_FIELDS,
  createEmptyJtbdEntry,
  jtbdResolver,
  toJtbdContent,
  toJtbdDefaults,
  type JtbdFormOutput,
  type JtbdFormValues,
} from './jtbdForm';

export function JtbdForm({ discoveryId }: { discoveryId: string }) {
  return (
    <FrameworkFormState
      discoveryId={discoveryId}
      frameworkKey={JTBD_KEY}
      loadingLabel="Loading jobs to be done"
      errorTitle="Could not load jobs to be done"
    >
      {(initialContent) => (
        <JtbdFields discoveryId={discoveryId} initialContent={initialContent} />
      )}
    </FrameworkFormState>
  );
}

function JtbdFields({
  discoveryId,
  initialContent,
}: {
  discoveryId: string;
  initialContent: JtbdContent | null;
}) {
  const queryClient = useQueryClient();

  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm<JtbdFormValues, unknown, JtbdFormOutput>({
    resolver: jtbdResolver,
    defaultValues: toJtbdDefaults(initialContent),
    mode: 'onSubmit',
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'entries',
  });

  const saveMutation = useMutation({
    mutationFn: (values: JtbdFormOutput) =>
      saveFramework(discoveryId, JTBD_KEY, toJtbdContent(values)),
    onSuccess: (saved) => {
      queryClient.setQueryData(
        workspaceKeys.framework(discoveryId, JTBD_KEY),
        saved,
      );
      reset(toJtbdDefaults(saved.content));
    },
  });

  const onSubmit = (values: JtbdFormOutput): void => {
    saveMutation.mutate(values);
  };

  const submit = handleSubmit(onSubmit);
  const addEntry = (): void => {
    append(createEmptyJtbdEntry());
  };

  return (
    <FrameworkFormShell
      headingId="jtbd-heading"
      stageLabel="Understand"
      title="Jobs to be done"
      description="Capture the jobs your users are trying to get done. Add one card per job."
      isDirty={isDirty}
      isSaving={saveMutation.isPending}
      isError={saveMutation.isError}
      isSaved={saveMutation.isSuccess && !isDirty}
      errorMessage={
        saveMutation.isError
          ? getApiErrorMessage(saveMutation.error)
          : undefined
      }
      onSubmit={(event) => {
        void submit(event);
      }}
    >
      {fields.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/60 px-6 py-10 text-center">
          <p className="text-sm font-medium text-slate-900">No jobs yet</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
            Start with the most important job your users are trying to get done.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={addEntry}
          >
            <Plus className="size-3.5" aria-hidden="true" />
            Add JTBD
          </Button>
        </div>
      ) : (
        <ol className="space-y-4">
          {fields.map((field, index) => (
            <li
              key={field.id}
              className="rounded-lg border border-slate-200 bg-slate-50/60 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-medium tracking-wider text-slate-500 uppercase">
                  Job {index + 1}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label={`Remove job ${index + 1}`}
                  onClick={() => {
                    remove(index);
                  }}
                >
                  <Trash2 className="size-3.5" aria-hidden="true" />
                  Remove
                </Button>
              </div>

              <div className="mt-3 space-y-4">
                {JTBD_FIELDS.map((config) => (
                  <Controller
                    key={config.name}
                    control={control}
                    name={`entries.${index}.${config.name}`}
                    render={({ field: input, fieldState }) => {
                      const inputId = `jtbd-${index}-${config.name}`;
                      const helperId = `${inputId}-helper`;
                      const errorId = `${inputId}-error`;

                      return (
                        <div className="space-y-1.5">
                          <div className="flex items-baseline justify-between gap-2">
                            <Label htmlFor={inputId}>
                              {config.label}
                              {config.required ? (
                                <span
                                  className="text-red-600"
                                  aria-hidden="true"
                                >
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

                          {config.multiline ? (
                            <Textarea
                              {...input}
                              id={inputId}
                              value={input.value ?? ''}
                              placeholder={config.placeholder}
                              aria-required={config.required ? true : undefined}
                              aria-invalid={
                                fieldState.invalid ? true : undefined
                              }
                              aria-describedby={
                                fieldState.error ? errorId : helperId
                              }
                              className="bg-white"
                            />
                          ) : (
                            <Input
                              {...input}
                              id={inputId}
                              value={input.value ?? ''}
                              placeholder={config.placeholder}
                              aria-invalid={
                                fieldState.invalid ? true : undefined
                              }
                              aria-describedby={
                                fieldState.error ? errorId : helperId
                              }
                              className="bg-white"
                            />
                          )}

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
            </li>
          ))}
        </ol>
      )}

      {fields.length === 0 ? null : (
        <Button type="button" variant="outline" onClick={addEntry}>
          <Plus className="size-4" aria-hidden="true" />
          Add JTBD
        </Button>
      )}
    </FrameworkFormShell>
  );
}
