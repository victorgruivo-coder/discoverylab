import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { jtbdEntry, type JtbdContent } from '@discoverylab/shared';

/**
 * The shared JTBD schema owns the rules; this form-only copy drops entry ids
 * (not user-editable) and gives the required field a human message.
 */
export const jtbdFormEntry = jtbdEntry.omit({ id: true }).extend({
  jobStatement: z.string().trim().min(1, 'Describe the job before saving.'),
});

export const jtbdFormSchema = z.object({ entries: z.array(jtbdFormEntry) });
export type JtbdFormValues = z.input<typeof jtbdFormSchema>;
export type JtbdFormOutput = z.output<typeof jtbdFormSchema>;
export type JtbdFormEntryValues = JtbdFormValues['entries'][number];

export const jtbdResolver = zodResolver(jtbdFormSchema);

export type JtbdFieldConfig = {
  name: 'jobStatement' | 'segment' | 'notes';
  label: string;
  placeholder: string;
  helper: string;
  multiline: boolean;
  required?: boolean;
};

export const JTBD_FIELDS: readonly JtbdFieldConfig[] = [
  {
    name: 'jobStatement',
    label: 'Job statement',
    placeholder:
      'When I compare supplier quotes, I want to see landed cost, so I can pick the best supplier without re-keying data.',
    helper:
      'Use the “When…, I want to…, so I can…” shape. Describe the job, not your product.',
    multiline: true,
    required: true,
  },
  {
    name: 'segment',
    label: 'Segment',
    placeholder: 'e.g. Procurement managers handling 20+ quotes a week',
    helper: 'Who has this job? A role, team, or customer type is enough.',
    multiline: false,
  },
  {
    name: 'notes',
    label: 'Notes',
    placeholder:
      'e.g. Today this takes 40 minutes in spreadsheets and errors are common.',
    helper:
      'Evidence, workarounds, or context that explains why this job matters.',
    multiline: true,
  },
];

export function createEmptyJtbdEntry(): JtbdFormEntryValues {
  return { jobStatement: '', segment: '', notes: '' };
}

export function toJtbdDefaults(content: JtbdContent | null): JtbdFormValues {
  const entries = content ?? [];

  return {
    entries:
      entries.length === 0
        ? [createEmptyJtbdEntry()]
        : entries.map((entry) => ({
            jobStatement: entry.jobStatement,
            segment: entry.segment ?? '',
            notes: entry.notes ?? '',
          })),
  };
}

export function toJtbdContent(values: JtbdFormOutput): JtbdContent {
  return values.entries;
}
