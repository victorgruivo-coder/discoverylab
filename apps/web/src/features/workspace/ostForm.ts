import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import {
  optionalText,
  ostNodeType,
  uuid,
  type OstContent,
  type OstNodeType,
} from '@discoverylab/shared';

/** Sentinel for the "no parent" option; Radix Select forbids empty values. */
export const ROOT_PARENT = '__root__' as const;

export const ostFormNode = z.object({
  id: uuid,
  title: z.string().trim().min(1, 'Give this node a title before saving.'),
  type: ostNodeType,
  parentId: z.union([uuid, z.literal(ROOT_PARENT)]),
  notes: optionalText,
});

export const ostFormSchema = z.object({ nodes: z.array(ostFormNode) });
export type OstFormValues = z.input<typeof ostFormSchema>;
export type OstFormOutput = z.output<typeof ostFormSchema>;
export type OstFormNodeValues = OstFormValues['nodes'][number];

export const ostResolver = zodResolver(ostFormSchema);

export const OST_TYPE_OPTIONS: readonly {
  value: OstNodeType;
  label: string;
}[] = [
  { value: 'outcome', label: 'Outcome' },
  { value: 'opportunity', label: 'Opportunity' },
  { value: 'solution', label: 'Solution' },
  { value: 'experiment', label: 'Experiment' },
];

export function createEmptyOstNode(
  type: OstNodeType = 'opportunity',
): OstFormNodeValues {
  return {
    id: crypto.randomUUID(),
    title: '',
    type,
    parentId: ROOT_PARENT,
    notes: '',
  };
}

export function toOstDefaults(content: OstContent | null): OstFormValues {
  const nodes = content?.nodes ?? [];

  return {
    nodes:
      nodes.length === 0
        ? [createEmptyOstNode('outcome')]
        : nodes.map((node) => ({
            id: node.id ?? crypto.randomUUID(),
            title: node.title,
            type: node.type,
            parentId: node.parentId ?? ROOT_PARENT,
            notes: node.notes ?? '',
          })),
  };
}

export function toOstContent(values: OstFormOutput): OstContent {
  return {
    nodes: values.nodes.map((node) => ({
      id: node.id,
      title: node.title,
      type: node.type,
      parentId: node.parentId === ROOT_PARENT ? null : node.parentId,
      notes: node.notes ?? '',
    })),
  };
}
