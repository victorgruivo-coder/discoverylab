import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import {
  problemStatementContent,
  type ProblemStatementContent,
} from '@discoverylab/shared';

/**
 * The shared schema is the source of truth, with one presentation-only override:
 * the required field gets a human message instead of Zod's default. The rules
 * (trimmed, non-empty, optional text, storage ceiling) are unchanged.
 */
export const problemStatementFormSchema = problemStatementContent.extend({
  problem: z.string().trim().min(1, 'Describe the problem before saving.'),
});

export type ProblemStatementFormValues = z.input<
  typeof problemStatementFormSchema
>;
export type ProblemStatementFormOutput = z.output<
  typeof problemStatementFormSchema
>;

export const problemStatementResolver = zodResolver(problemStatementFormSchema);

export type ProblemStatementField = {
  name: keyof ProblemStatementFormValues;
  label: string;
  placeholder: string;
  helper: string;
  required?: boolean;
};

/** Qualitative fields: example placeholder plus a short "what good looks like". */
export const PROBLEM_STATEMENT_FIELDS: readonly ProblemStatementField[] = [
  {
    name: 'problem',
    label: 'Problem',
    placeholder: "When I'm comparing supplier quotes, I want to...",
    helper:
      'Describe the user problem in one or two sentences. Focus on the need, not the solution.',
    required: true,
  },
  {
    name: 'whoIsAffected',
    label: 'Who is affected',
    placeholder: 'e.g. Procurement managers handling 20+ quotes a week',
    helper: 'Name the people or roles who feel this problem most acutely.',
  },
  {
    name: 'whyNow',
    label: 'Why now',
    placeholder:
      'e.g. Our supplier count doubled this quarter and quote turnaround is slipping',
    helper:
      'Explain the trigger or the cost of waiting. What changed recently?',
  },
  {
    name: 'constraints',
    label: 'Constraints',
    placeholder: 'e.g. No new headcount; must work with the current ERP',
    helper:
      'List the limits any solution must respect: time, budget, technology, or policy.',
  },
  {
    name: 'successCriteria',
    label: 'Success criteria',
    placeholder:
      'e.g. Quote comparison takes under 10 minutes and pricing errors halve',
    helper:
      'Describe how you will know the problem is solved. Be specific and measurable.',
  },
];

export function toProblemStatementDefaults(
  content: ProblemStatementContent | null,
): ProblemStatementFormValues {
  return {
    problem: content?.problem ?? '',
    whoIsAffected: content?.whoIsAffected ?? '',
    whyNow: content?.whyNow ?? '',
    constraints: content?.constraints ?? '',
    successCriteria: content?.successCriteria ?? '',
  };
}
