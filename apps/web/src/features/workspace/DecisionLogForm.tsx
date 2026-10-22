import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';

import type { DecisionLogContent } from '@discoverylab/shared';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { getApiErrorMessage } from '@/lib/api-client';

import { DECISION_LOG_KEY, saveFramework, workspaceKeys } from './api';
import {
  DECISION_FIELDS,
  createEmptyDecisionEntry,
  decisionLogResolver,
  toDecisionContent,
  toDecisionDefaults,
  type DecisionLogFormOutput,
  type DecisionLogFormValues,
} from './decisionLogForm';
import { FrameworkFormShell } from './FrameworkFormShell';
import { FrameworkFormState } from './FrameworkFormState';

export function DecisionLogForm({ discoveryId }: { discoveryId: string }) {
  return (
    <FrameworkFormState
      discoveryId={discoveryId}
      frameworkKey={DECISION_LOG_KEY}
      loadingLabel="Loading decision log"
      errorTitle="Could not load the decision log"
    >
      {(initialContent) => (
        <DecisionLogFields
          discoveryId={discoveryId}
          initialContent={initialContent}
        />
      )}
    </FrameworkFormState>
  );
}

function DecisionLogFields({
  discoveryId,
  initialContent,
}: {
  discoveryId: string;
  initialContent: DecisionLogContent | null;
}) {
  const queryClient = useQueryClient();

  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm<DecisionLogFormValues, unknown, DecisionLogFormOutput>({
    resolver: decisionLogResolver,
    defaultValues: toDecisionDefaults(initialContent),
    mode: 'onSubmit',
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'entries',
  });

  const saveMutation = useMutation({
    mutationFn: (values: DecisionLogFormOutput) =>
      saveFramework(discoveryId, DECISION_LOG_KEY, toDecisionContent(values)),
    onSuccess: (saved) => {
      queryClient.setQueryData(
        workspaceKeys.framework(discoveryId, DECISION_LOG_KEY),
        saved,
      );
      reset(toDecisionDefaults(saved.content));
    },
  });

  const onSubmit = (values: DecisionLogFormOutput): void => {
    saveMutation.mutate(values);
  };

  const submit = handleSubmit(onSubmit);
  const addEntry = (): void => {
    append(createEmptyDecisionEntry());
  };

  return (
    <FrameworkFormShell
      headingId="decision-log-heading"
      stageLabel="Decide"
      title="Decision log"
      description="Record the decisions that shape this discovery, with the rationale and owner."
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
          <p className="text-sm font-medium text-slate-900">No decisions yet</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
            Log the next decision so the team can see what changed and why.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={addEntry}
          >
            <Plus className="size-3.5" aria-hidden="true" />
            Add decision
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
                  Decision {index + 1}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label={`Remove decision ${index + 1}`}
                  onClick={() => {
                    remove(index);
                  }}
                >
                  <Trash2 className="size-3.5" aria-hidden="true" />
                  Remove
                </Button>
              </div>

              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                {DECISION_FIELDS.map((config) => (
                  <Controller
                    key={config.name}
                    control={control}
                    name={`entries.${index}.${config.name}`}
                    render={({ field: input, fieldState }) => {
                      const inputId = `decision-${index}-${config.name}`;
                      const helperId = `${inputId}-helper`;
                      const errorId = `${inputId}-error`;
                      const describedBy = fieldState.error ? errorId : helperId;

                      return (
                        <div
                          className={
                            config.fullWidth
                              ? 'space-y-1.5 sm:col-span-2'
                              : 'space-y-1.5'
                          }
                        >
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

                          {config.kind === 'textarea' ? (
                            <Textarea
                              {...input}
                              id={inputId}
                              value={input.value ?? ''}
                              placeholder={config.placeholder}
                              aria-required={config.required ? true : undefined}
                              aria-invalid={
                                fieldState.invalid ? true : undefined
                              }
                              aria-describedby={describedBy}
                              className="bg-white"
                            />
                          ) : config.kind === 'date' ? (
                            <Input
                              {...input}
                              id={inputId}
                              type="date"
                              value={input.value ?? ''}
                              aria-invalid={
                                fieldState.invalid ? true : undefined
                              }
                              aria-describedby={describedBy}
                              className="bg-white"
                            />
                          ) : (
                            <Input
                              {...input}
                              id={inputId}
                              type="text"
                              value={input.value ?? ''}
                              placeholder={config.placeholder}
                              aria-invalid={
                                fieldState.invalid ? true : undefined
                              }
                              aria-describedby={describedBy}
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
          Add decision
        </Button>
      )}
    </FrameworkFormShell>
  );
}
