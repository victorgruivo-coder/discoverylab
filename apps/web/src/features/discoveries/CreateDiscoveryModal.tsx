import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { DISCOVERY_TYPES, discoveryCreateInput } from '@discoverylab/shared';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/features/auth/AuthContext';
import { createDiscovery, discoveryKeys } from '@/features/discoveries/api';
import { getApiErrorMessage } from '@/lib/api-client';
import { formatEnumLabel, todayIsoDate } from '@/lib/format';

type CreateDiscoveryModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * Form-only variant of the shared create schema. The lead input stays a string
 * while editing so clearing it does not make RHF fall back to the default
 * value; an empty or whitespace-only lead becomes `undefined` at validation
 * time, which lets the API apply its signed-in-user fallback.
 */
const discoveryFormInput = discoveryCreateInput.safeExtend({
  leadName: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value === '' ? undefined : value)),
});

/** `type` has a Zod default, so the form's input and output types differ. */
type FormInputValues = z.input<typeof discoveryFormInput>;
type FormOutputValues = z.output<typeof discoveryFormInput>;

/**
 * Built once at module load instead of on every render/open. `useForm` itself
 * does no validation until submit, so mounting the form stays cheap.
 */
const discoveryFormResolver = zodResolver(discoveryFormInput);

export function CreateDiscoveryModal({
  open,
  onOpenChange,
}: CreateDiscoveryModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);

  const defaultValues: FormInputValues = {
    name: '',
    leadName: user?.name ?? '',
    type: 'feature',
    startDate: todayIsoDate(),
  };

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormInputValues, unknown, FormOutputValues>({
    resolver: discoveryFormResolver,
    defaultValues,
    mode: 'onSubmit',
  });

  const onSubmit = async (values: FormOutputValues): Promise<void> => {
    setServerError(null);

    try {
      await createDiscovery(values);
      await queryClient.invalidateQueries({ queryKey: discoveryKeys.all });
      onOpenChange(false);
    } catch (error) {
      setServerError(getApiErrorMessage(error));
    }
  };

  const submit = handleSubmit(onSubmit);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New discovery</DialogTitle>
          <DialogDescription>
            Give the effort a name and a starting point. You can refine the
            details as you go.
          </DialogDescription>
        </DialogHeader>

        <form
          noValidate
          className="space-y-4"
          onSubmit={(event) => {
            void submit(event);
          }}
        >
          <Controller
            control={control}
            name="name"
            render={({ field, fieldState }) => (
              <div className="space-y-1.5">
                <Label htmlFor="discovery-name">Name</Label>
                <Input
                  {...field}
                  id="discovery-name"
                  type="text"
                  placeholder="e.g. Reduce onboarding drop-off"
                  value={field.value ?? ''}
                  aria-invalid={fieldState.invalid ? true : undefined}
                  aria-describedby={
                    fieldState.error ? 'discovery-name-error' : undefined
                  }
                />
                {fieldState.error?.message ? (
                  <p id="discovery-name-error" className="text-xs text-red-600">
                    {fieldState.error.message}
                  </p>
                ) : null}
              </div>
            )}
          />

          <Controller
            control={control}
            name="leadName"
            render={({ field, fieldState }) => (
              <div className="space-y-1.5">
                <Label htmlFor="discovery-lead">Lead name</Label>
                <Input
                  {...field}
                  id="discovery-lead"
                  type="text"
                  placeholder="Who is leading this discovery?"
                  value={field.value ?? ''}
                  aria-invalid={fieldState.invalid ? true : undefined}
                  aria-describedby={
                    fieldState.error
                      ? 'discovery-lead-error'
                      : 'discovery-lead-hint'
                  }
                />
                {fieldState.error?.message ? (
                  <p id="discovery-lead-error" className="text-xs text-red-600">
                    {fieldState.error.message}
                  </p>
                ) : (
                  <p
                    id="discovery-lead-hint"
                    className="text-xs text-slate-500"
                  >
                    Defaults to your name.
                  </p>
                )}
              </div>
            )}
          />

          <Controller
            control={control}
            name="type"
            render={({ field, fieldState }) => (
              <div className="space-y-1.5">
                <Label htmlFor="discovery-type">Type</Label>
                <Select
                  value={field.value ?? 'feature'}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger
                    id="discovery-type"
                    className="w-full"
                    aria-invalid={fieldState.invalid ? true : undefined}
                    aria-describedby={
                      fieldState.error ? 'discovery-type-error' : undefined
                    }
                  >
                    <SelectValue placeholder="Select a type" />
                  </SelectTrigger>
                  <SelectContent>
                    {DISCOVERY_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {formatEnumLabel(type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldState.error?.message ? (
                  <p id="discovery-type-error" className="text-xs text-red-600">
                    {fieldState.error.message}
                  </p>
                ) : null}
              </div>
            )}
          />

          <Controller
            control={control}
            name="startDate"
            render={({ field, fieldState }) => (
              <div className="space-y-1.5">
                <Label htmlFor="discovery-start-date">Start date</Label>
                <Input
                  {...field}
                  id="discovery-start-date"
                  type="date"
                  value={field.value ?? ''}
                  aria-invalid={fieldState.invalid ? true : undefined}
                  aria-describedby={
                    fieldState.error ? 'discovery-start-date-error' : undefined
                  }
                />
                {fieldState.error?.message ? (
                  <p
                    id="discovery-start-date-error"
                    className="text-xs text-red-600"
                  >
                    {fieldState.error.message}
                  </p>
                ) : null}
              </div>
            )}
          />

          {serverError === null ? null : (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {serverError}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => {
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : null}
              {isSubmitting ? 'Creating…' : 'Create discovery'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
