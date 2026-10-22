import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';

import type { OstContent } from '@discoverylab/shared';

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
import { Textarea } from '@/components/ui/textarea';
import { getApiErrorMessage } from '@/lib/api-client';

import { OST_KEY, saveFramework, workspaceKeys } from './api';
import { FrameworkFormShell } from './FrameworkFormShell';
import { FrameworkFormState } from './FrameworkFormState';
import {
  OST_TYPE_OPTIONS,
  ROOT_PARENT,
  createEmptyOstNode,
  ostResolver,
  toOstContent,
  toOstDefaults,
  type OstFormNodeValues,
  type OstFormOutput,
  type OstFormValues,
} from './ostForm';

export function OstForm({ discoveryId }: { discoveryId: string }) {
  return (
    <FrameworkFormState
      discoveryId={discoveryId}
      frameworkKey={OST_KEY}
      loadingLabel="Loading opportunity solution tree"
      errorTitle="Could not load the opportunity solution tree"
      skeletonRows={3}
    >
      {(initialContent) => (
        <OstFields discoveryId={discoveryId} initialContent={initialContent} />
      )}
    </FrameworkFormState>
  );
}

function OstFields({
  discoveryId,
  initialContent,
}: {
  discoveryId: string;
  initialContent: OstContent | null;
}) {
  const queryClient = useQueryClient();

  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm<OstFormValues, unknown, OstFormOutput>({
    resolver: ostResolver,
    defaultValues: toOstDefaults(initialContent),
    mode: 'onSubmit',
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'nodes' });
  // Watch only the fields needed for indentation and parent options. Typing in
  // Notes or changing Type no longer re-renders every card.
  const nodes = useWatch({
    control,
    name: 'nodes',
    compute: (nodes) =>
      nodes.map(({ id, parentId, title }) => ({
        id,
        parentId,
        title,
      })),
  });

  const saveMutation = useMutation({
    mutationFn: (values: OstFormOutput) =>
      saveFramework(discoveryId, OST_KEY, toOstContent(values)),
    onSuccess: (saved) => {
      queryClient.setQueryData(
        workspaceKeys.framework(discoveryId, OST_KEY),
        saved,
      );
      reset(toOstDefaults(saved.content));
    },
  });

  const onSubmit = (values: OstFormOutput): void => {
    saveMutation.mutate(values);
  };

  const submit = handleSubmit(onSubmit);
  const addNode = (): void => {
    append(createEmptyOstNode());
  };

  return (
    <FrameworkFormShell
      headingId="ost-heading"
      stageLabel="Explore"
      title="Opportunity solution tree"
      description="Map the outcome to the opportunities, solutions, and experiments that could get you there."
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
          <p className="text-sm font-medium text-slate-900">No nodes yet</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
            Start with the outcome you want to change, then branch into
            opportunities.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => {
              append(createEmptyOstNode('outcome'));
            }}
          >
            <Plus className="size-3.5" aria-hidden="true" />
            Add node
          </Button>
        </div>
      ) : (
        <ol className="space-y-3">
          {fields.map((field, index) => {
            const depth = getOstDepth(nodes, index);
            const currentNode = nodes[index];
            const parentOptions = getParentOptions(nodes, currentNode);

            return (
              <li
                key={field.id}
                style={{ marginLeft: `${Math.min(depth, 4) * 16}px` }}
                className="rounded-lg border border-slate-200 bg-slate-50/60 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-medium tracking-wider text-slate-500 uppercase">
                      Node {index + 1}
                    </p>
                    {depth > 0 ? (
                      <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] text-slate-600">
                        Depth {depth}
                      </span>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-label={`Remove node ${index + 1}`}
                    onClick={() => {
                      remove(index);
                    }}
                  >
                    <Trash2 className="size-3.5" aria-hidden="true" />
                    Remove
                  </Button>
                </div>

                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Controller
                      control={control}
                      name={`nodes.${index}.title`}
                      render={({ field: input, fieldState }) => {
                        const inputId = `ost-${index}-title`;

                        return (
                          <>
                            <Label htmlFor={inputId}>
                              Title
                              <span className="text-red-600" aria-hidden="true">
                                *
                              </span>
                            </Label>
                            <Input
                              {...input}
                              id={inputId}
                              value={input.value}
                              placeholder="e.g. Procurement managers cannot compare landed cost"
                              aria-required={true}
                              aria-invalid={
                                fieldState.invalid ? true : undefined
                              }
                              className="bg-white"
                            />
                            {fieldState.error?.message ? (
                              <p className="text-xs text-red-600">
                                {fieldState.error.message}
                              </p>
                            ) : (
                              <p className="text-xs text-slate-500">
                                One idea per node. Keep the title short and
                                specific.
                              </p>
                            )}
                          </>
                        );
                      }}
                    />
                  </div>

                  <Controller
                    control={control}
                    name={`nodes.${index}.type`}
                    render={({ field: input, fieldState }) => {
                      const inputId = `ost-${index}-type`;

                      return (
                        <div className="space-y-1.5">
                          <Label htmlFor={inputId}>Type</Label>
                          <Select
                            value={input.value}
                            onValueChange={(value) => {
                              input.onChange(value);
                            }}
                          >
                            <SelectTrigger
                              id={inputId}
                              className="w-full bg-white"
                              aria-invalid={
                                fieldState.invalid ? true : undefined
                              }
                            >
                              <SelectValue placeholder="Choose a type" />
                            </SelectTrigger>
                            <SelectContent>
                              {OST_TYPE_OPTIONS.map((option) => (
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      );
                    }}
                  />

                  <Controller
                    control={control}
                    name={`nodes.${index}.parentId`}
                    render={({ field: input, fieldState }) => {
                      const inputId = `ost-${index}-parent`;

                      return (
                        <div className="space-y-1.5">
                          <Label htmlFor={inputId}>Parent</Label>
                          <Select
                            value={input.value}
                            onValueChange={(value) => {
                              input.onChange(value);
                            }}
                          >
                            <SelectTrigger
                              id={inputId}
                              className="w-full bg-white"
                              aria-invalid={
                                fieldState.invalid ? true : undefined
                              }
                            >
                              <SelectValue placeholder="No parent (root)" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={ROOT_PARENT}>
                                No parent (root)
                              </SelectItem>
                              {parentOptions.map((node) => (
                                <SelectItem key={node.id} value={node.id}>
                                  {node.title.trim() === ''
                                    ? 'Untitled node'
                                    : node.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-slate-500">
                            Pick the node this branch belongs under.
                          </p>
                        </div>
                      );
                    }}
                  />

                  <Controller
                    control={control}
                    name={`nodes.${index}.notes`}
                    render={({ field: input, fieldState }) => {
                      const inputId = `ost-${index}-notes`;

                      return (
                        <div className="space-y-1.5 sm:col-span-2">
                          <div className="flex items-baseline justify-between gap-2">
                            <Label htmlFor={inputId}>Notes</Label>
                            <span className="text-xs font-normal text-slate-400">
                              Optional
                            </span>
                          </div>
                          <Textarea
                            {...input}
                            id={inputId}
                            value={input.value ?? ''}
                            placeholder="Evidence, assumptions, or what would make this branch worth testing."
                            aria-invalid={fieldState.invalid ? true : undefined}
                            className="bg-white"
                          />
                        </div>
                      );
                    }}
                  />
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {fields.length === 0 ? null : (
        <Button type="button" variant="outline" onClick={addNode}>
          <Plus className="size-4" aria-hidden="true" />
          Add node
        </Button>
      )}
    </FrameworkFormShell>
  );
}

/** The subset of a node the flat list needs for depth and parent labels. */
type OstTreeItem = Pick<OstFormNodeValues, 'id' | 'parentId' | 'title'>;

/** Walks parent links to indent each node without reordering the flat list. */
function getOstDepth(nodes: readonly OstTreeItem[], index: number): number {
  const node = nodes[index];

  if (node === undefined) {
    return 0;
  }

  const parentByChild = new Map<string, string>();

  for (const candidate of nodes) {
    parentByChild.set(candidate.id, candidate.parentId);
  }

  let depth = 0;
  let parentId = node.parentId;
  const seen = new Set<string>();

  while (parentId !== ROOT_PARENT && !seen.has(parentId)) {
    seen.add(parentId);
    depth += 1;
    parentId = parentByChild.get(parentId) ?? ROOT_PARENT;

    if (depth > 20) {
      break;
    }
  }

  return depth;
}

/**
 * A node cannot parent itself or any of its descendants. Excluding both keeps
 * the tree acyclic without a drag-and-drop library.
 */
function getParentOptions(
  nodes: readonly OstTreeItem[],
  currentNode: OstTreeItem | undefined,
): readonly OstTreeItem[] {
  if (currentNode === undefined) {
    return nodes;
  }

  const blocked = new Set<string>([currentNode.id]);
  let changed = true;

  while (changed) {
    changed = false;

    for (const node of nodes) {
      if (node.parentId !== ROOT_PARENT && blocked.has(node.parentId)) {
        if (!blocked.has(node.id)) {
          blocked.add(node.id);
          changed = true;
        }
      }
    }
  }

  return nodes.filter((node) => !blocked.has(node.id));
}
