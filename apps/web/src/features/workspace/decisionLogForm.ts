import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import {
  decisionEntry,
  isoDate,
  type DecisionLogContent,
} from '@discoverylab/shared';

const dateOrEmpty = z
  .string()
  .trim()
  .refine(
    (value) => value === '' || isoDate.safeParse(value).success,
    'Use a valid date (YYYY-MM-DD).',
  );

export const decisionFormEntry = decisionEntry.omit({ id: true }).extend({
  decision: z.string().trim().min(1, 'Describe the decision before saving.'),
  decidedAt: dateOrEmpty,
});

export const decisionLogFormSchema = z.object({
  entries: z.array(decisionFormEntry),
});
export type DecisionLogFormValues = z.input<typeof decisionLogFormSchema>;
export type DecisionLogFormOutput = z.output<typeof decisionLogFormSchema>;
export type DecisionLogFormEntryValues =
  DecisionLogFormValues['entries'][number];

export const decisionLogResolver = zodResolver(decisionLogFormSchema);

export type DecisionFieldConfig = {
  name: 'decision' | 'rationale' | 'decidedAt' | 'owner';
  label: string;
  placeholder: string;
  helper: string;
  kind: 'text' | 'textarea' | 'date';
  required?: boolean;
  fullWidth?: boolean;
};

export const DECISION_FIELDS: readonly DecisionFieldConfig[] = [
  {
    name: 'decision',
    label: 'Decision',
    placeholder:
      'e.g. Build the landed-cost comparison before supplier scoring',
    helper: 'State what was decided in one sentence.',
    kind: 'textarea',
    required: true,
    fullWidth: true,
  },
  {
    name: 'rationale',
    label: 'Rationale',
    placeholder:
      'e.g. Landed cost was the top blocker in five interviews and blocks the scoring work.',
    helper: 'Explain why this option won and what you are trading off.',
    kind: 'textarea',
    fullWidth: true,
  },
  {
    name: 'decidedAt',
    label: 'Decided at',
    placeholder: '',
    helper: 'The date the decision was made.',
    kind: 'date',
  },
  {
    name: 'owner',
    label: 'Owner',
    placeholder: 'e.g. Priya Shah',
    helper: 'Who is accountable for following through?',
    kind: 'text',
  },
];

export function createEmptyDecisionEntry(): DecisionLogFormEntryValues {
  return { decision: '', rationale: '', decidedAt: '', owner: '' };
}

export function toDecisionDefaults(
  content: DecisionLogContent | null,
): DecisionLogFormValues {
  const entries = content ?? [];

  return {
    entries:
      entries.length === 0
        ? [createEmptyDecisionEntry()]
        : entries.map((entry) => ({
            decision: entry.decision,
            rationale: entry.rationale ?? '',
            decidedAt: entry.decidedAt ?? '',
            owner: entry.owner ?? '',
          })),
  };
}

export function toDecisionContent(
  values: DecisionLogFormOutput,
): DecisionLogContent {
  return values.entries.map((entry) => {
    const rationale = entry.rationale ?? '';
    const decidedAt = entry.decidedAt ?? '';
    const owner = entry.owner ?? '';

    return {
      decision: entry.decision,
      ...(rationale === '' ? {} : { rationale }),
      ...(decidedAt === '' ? {} : { decidedAt }),
      ...(owner === '' ? {} : { owner }),
    };
  });
}
