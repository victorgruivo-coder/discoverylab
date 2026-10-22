import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import {
  Controller,
  useFieldArray,
  useForm,
  useWatch,
  type Control,
} from 'react-hook-form';

import type { RiceContent } from '@discoverylab/shared';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getApiErrorMessage } from '@/lib/api-client';

import { RICE_KEY, saveFramework, workspaceKeys } from './api';
import { FrameworkFormShell } from './FrameworkFormShell';
import { FrameworkFormState } from './FrameworkFormState';
import {
  createEmptyRiceEntry,
  previewRiceScore,
  riceResolver,
  toRiceContent,
  toRiceDefaults,
  type RiceFormOutput,
  type RiceFormValues,
} from './riceForm';

export function RiceForm({ discoveryId }: { discoveryId: string }) {
  return (
    <FrameworkFormState
      discoveryId={discoveryId}
      frameworkKey={RICE_KEY}
      loadingLabel="Loading RICE priorities"
      errorTitle="Could not load RICE priorities"
    >
      {(initialContent) => (
        <RiceFields discoveryId={discoveryId} initialContent={initialContent} />
      )}
    </FrameworkFormState>
  );
}

function RiceFields({
  discoveryId,
  initialContent,
}: {
  discoveryId: string;
  initialContent: RiceContent | null;
}) {
  const queryClient = useQueryClient();

  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm<RiceFormValues, unknown, RiceFormOutput>({
    resolver: riceResolver,
    defaultValues: toRiceDefaults(initialContent),
    mode: 'onSubmit',
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'entries',
  });

  const saveMutation = useMutation({
    mutationFn: (values: RiceFormOutput) =>
      saveFramework(discoveryId, RICE_KEY, toRiceContent(values)),
    onSuccess: (saved) => {
      queryClient.setQueryData(
        workspaceKeys.framework(discoveryId, RICE_KEY),
        saved,
      );
      reset(toRiceDefaults(saved.content));
    },
  });

  const onSubmit = (values: RiceFormOutput): void => {
    saveMutation.mutate(values);
  };

  const submit = handleSubmit(onSubmit);
  const addEntry = (): void => {
    append(createEmptyRiceEntry());
  };

  return (
    <FrameworkFormShell
      headingId="rice-heading"
      stageLabel="Prioritize"
      title="RICE prioritization"
      description="Score each opportunity by reach, impact, confidence, and effort. The score updates as you type."
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
          <p className="text-sm font-medium text-slate-900">
            No opportunities scored yet
          </p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
            Add the opportunities you are considering, then score each one.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={addEntry}
          >
            <Plus className="size-3.5" aria-hidden="true" />
            Add RICE row
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
                <div className="flex min-w-0 items-center gap-3">
                  <p className="text-xs font-medium tracking-wider text-slate-500 uppercase">
                    Opportunity {index + 1}
                  </p>
                  <RiceScoreBadge control={control} index={index} />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label={`Remove opportunity ${index + 1}`}
                  onClick={() => {
                    remove(index);
                  }}
                >
                  <Trash2 className="size-3.5" aria-hidden="true" />
                  Remove
                </Button>
              </div>

              <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1.5 sm:col-span-2 lg:col-span-4">
                  <Controller
                    control={control}
                    name={`entries.${index}.opportunityName`}
                    render={({ field: input, fieldState }) => {
                      const inputId = `rice-${index}-name`;

                      return (
                        <>
                          <Label htmlFor={inputId}>
                            Opportunity name
                            <span className="text-red-600" aria-hidden="true">
                              *
                            </span>
                          </Label>
                          <Input
                            {...input}
                            id={inputId}
                            value={input.value}
                            placeholder="e.g. Landed-cost comparison workspace"
                            aria-required={true}
                            aria-invalid={fieldState.invalid ? true : undefined}
                            className="bg-white"
                          />
                          {fieldState.error?.message ? (
                            <p className="text-xs text-red-600">
                              {fieldState.error.message}
                            </p>
                          ) : (
                            <p className="text-xs text-slate-500">
                              Name the opportunity the way you would say it in a
                              planning meeting.
                            </p>
                          )}
                        </>
                      );
                    }}
                  />
                </div>

                <Controller
                  control={control}
                  name={`entries.${index}.reach`}
                  render={({ field: input, fieldState }) => {
                    const inputId = `rice-${index}-reach`;

                    return (
                      <div className="space-y-1.5">
                        <Label htmlFor={inputId}>Reach</Label>
                        <Input
                          {...input}
                          id={inputId}
                          type="number"
                          inputMode="decimal"
                          min="0"
                          step="any"
                          value={input.value}
                          placeholder="e.g. 500"
                          aria-invalid={fieldState.invalid ? true : undefined}
                          className="bg-white"
                        />
                        {fieldState.error?.message ? (
                          <p className="text-xs text-red-600">
                            {fieldState.error.message}
                          </p>
                        ) : (
                          <p className="text-xs text-slate-500">
                            People or accounts reached per period.
                          </p>
                        )}
                      </div>
                    );
                  }}
                />

                <Controller
                  control={control}
                  name={`entries.${index}.impact`}
                  render={({ field: input, fieldState }) => {
                    const inputId = `rice-${index}-impact`;

                    return (
                      <div className="space-y-1.5">
                        <Label htmlFor={inputId}>Impact</Label>
                        <Select
                          value={input.value}
                          onValueChange={(value) => {
                            input.onChange(value);
                          }}
                        >
                          <SelectTrigger
                            id={inputId}
                            className="w-full bg-white"
                            aria-invalid={fieldState.invalid ? true : undefined}
                          >
                            <SelectValue placeholder="Choose impact" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 — Low</SelectItem>
                            <SelectItem value="2">2 — Medium</SelectItem>
                            <SelectItem value="3">3 — High</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-slate-500">
                          Expected effect on the outcome.
                        </p>
                      </div>
                    );
                  }}
                />

                <Controller
                  control={control}
                  name={`entries.${index}.confidence`}
                  render={({ field: input, fieldState }) => {
                    const inputId = `rice-${index}-confidence`;

                    return (
                      <div className="space-y-1.5">
                        <Label htmlFor={inputId}>Confidence</Label>
                        <Input
                          {...input}
                          id={inputId}
                          type="number"
                          inputMode="decimal"
                          min="0"
                          max="1"
                          step="0.01"
                          value={input.value}
                          placeholder="e.g. 0.8"
                          aria-invalid={fieldState.invalid ? true : undefined}
                          className="bg-white"
                        />
                        {fieldState.error?.message ? (
                          <p className="text-xs text-red-600">
                            {fieldState.error.message}
                          </p>
                        ) : (
                          <p className="text-xs text-slate-500">
                            From 0 to 1. How sure are you?
                          </p>
                        )}
                      </div>
                    );
                  }}
                />

                <Controller
                  control={control}
                  name={`entries.${index}.effort`}
                  render={({ field: input, fieldState }) => {
                    const inputId = `rice-${index}-effort`;

                    return (
                      <div className="space-y-1.5">
                        <Label htmlFor={inputId}>Effort</Label>
                        <Input
                          {...input}
                          id={inputId}
                          type="number"
                          inputMode="decimal"
                          min="0"
                          step="any"
                          value={input.value}
                          placeholder="e.g. 2"
                          aria-invalid={fieldState.invalid ? true : undefined}
                          className="bg-white"
                        />
                        {fieldState.error?.message ? (
                          <p className="text-xs text-red-600">
                            {fieldState.error.message}
                          </p>
                        ) : (
                          <p className="text-xs text-slate-500">
                            Person-weeks or story points. Must be above zero.
                          </p>
                        )}
                      </div>
                    );
                  }}
                />
              </div>
            </li>
          ))}
        </ol>
      )}

      {fields.length === 0 ? null : (
        <Button type="button" variant="outline" onClick={addEntry}>
          <Plus className="size-4" aria-hidden="true" />
          Add RICE row
        </Button>
      )}

      {fields.length === 0 ? null : (
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500">
          Formula: (Reach × Impact × Confidence) ÷ Effort. Scores are rounded to
          two decimals and saved by the API.
        </div>
      )}
    </FrameworkFormShell>
  );
}

/**
 * Watches one row only, so typing in a field re-renders its score instead of
 * the whole form. The computation is the same helper the API uses.
 */
function RiceScoreBadge({
  control,
  index,
}: {
  control: Control<RiceFormValues, unknown, RiceFormOutput>;
  index: number;
}) {
  const entry = useWatch({ control, name: `entries.${index}` });
  const score = previewRiceScore(entry);

  return (
    <div
      className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-2 py-1"
      aria-live="polite"
    >
      <span className="text-[10px] font-medium tracking-wider text-slate-500 uppercase">
        Score
      </span>
      <span className="font-mono text-sm font-semibold text-slate-900">
        {score === null ? '—' : score.toFixed(2)}
      </span>
    </div>
  );
}
