import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { computeRiceScore, type RiceContent } from '@discoverylab/shared';

export const RICE_IMPACTS = ['1', '2', '3'] as const;
export type RiceImpactValue = (typeof RICE_IMPACTS)[number];

/** Form inputs stay strings so an empty field is invalid, not NaN. */
function numericString(
  message: string,
  isValid: (value: number) => boolean,
): z.ZodString {
  return z
    .string()
    .trim()
    .min(1, 'Enter a number.')
    .refine((value) => {
      const parsed = Number(value);

      return Number.isFinite(parsed) && isValid(parsed);
    }, message);
}

export const riceFormEntry = z.object({
  opportunityName: z
    .string()
    .trim()
    .min(1, 'Name the opportunity before saving.'),
  reach: numericString('Reach must be zero or more.', (value) => value >= 0),
  impact: z.enum(RICE_IMPACTS),
  confidence: numericString(
    'Confidence must be between 0 and 1.',
    (value) => value >= 0 && value <= 1,
  ),
  effort: numericString(
    'Effort must be greater than zero.',
    (value) => value > 0,
  ),
});

export const riceFormSchema = z.object({ entries: z.array(riceFormEntry) });
export type RiceFormValues = z.input<typeof riceFormSchema>;
export type RiceFormOutput = z.output<typeof riceFormSchema>;
export type RiceFormEntryValues = RiceFormValues['entries'][number];

export const riceResolver = zodResolver(riceFormSchema);

export function createEmptyRiceEntry(): RiceFormEntryValues {
  return {
    opportunityName: '',
    reach: '',
    impact: '1',
    confidence: '',
    effort: '',
  };
}

function toImpactValue(impact: number): RiceImpactValue {
  if (impact >= 3) {
    return '3';
  }

  return impact >= 2 ? '2' : '1';
}

export function toRiceDefaults(content: RiceContent | null): RiceFormValues {
  const entries = content ?? [];

  return {
    entries:
      entries.length === 0
        ? [createEmptyRiceEntry()]
        : entries.map((entry) => ({
            opportunityName: entry.opportunityName,
            reach: String(entry.reach),
            impact: toImpactValue(entry.impact),
            confidence: String(entry.confidence),
            effort: String(entry.effort),
          })),
  };
}

export function toRiceContent(values: RiceFormOutput): RiceContent {
  return values.entries.map((entry) => ({
    opportunityName: entry.opportunityName,
    reach: Number(entry.reach),
    impact: Number(entry.impact),
    confidence: Number(entry.confidence),
    effort: Number(entry.effort),
  }));
}

function toNumber(value: string): number | null {
  if (value.trim() === '') {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Uses the same `computeRiceScore` as the API so the live preview and the
 * persisted score agree. Returns null while a required number is incomplete.
 */
export function previewRiceScore(entry: RiceFormEntryValues): number | null {
  const reach = toNumber(entry.reach);
  const confidence = toNumber(entry.confidence);
  const effort = toNumber(entry.effort);

  if (
    reach === null ||
    confidence === null ||
    effort === null ||
    reach < 0 ||
    confidence < 0 ||
    confidence > 1 ||
    effort <= 0
  ) {
    return null;
  }

  return computeRiceScore({
    opportunityName: entry.opportunityName,
    reach,
    impact: Number(entry.impact),
    confidence,
    effort,
  });
}
