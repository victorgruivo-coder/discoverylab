// HTTP-boundary shapes for frameworks. The shared package owns the five content
// schemas; this module maps them to keys and adds the shapes only the API needs:
// path params, the keyed request body, and the stored (RICE-scored) output.
import { z } from 'zod';

import {
  decisionLogContent,
  isoDateTime,
  jtbdContent,
  ostContent,
  problemStatementContent,
  riceContent,
  riceEntry,
  uuid,
} from '@discoverylab/shared';
import type {
  DecisionLogContent,
  JtbdContent,
  OstContent,
  ProblemStatementContent,
  RiceContent,
} from '@discoverylab/shared';

/** The five fixed framework keys, in wizard stage order. */
export const frameworkKeys = [
  'problem-statement',
  'jtbd',
  'ost',
  'rice',
  'decision-log',
] as const;

export const frameworkKey = z.enum(frameworkKeys);
export type FrameworkKey = z.infer<typeof frameworkKey>;

/** `:id` is the discovery; a non-UUID or unknown key never reaches the service. */
export const frameworkParams = z.object({ id: uuid, key: frameworkKey });
export type FrameworkParams = z.infer<typeof frameworkParams>;

/** Content exactly as the client supplies it; RICE rows have no score yet. */
export type FrameworkContentInput = {
  'problem-statement': ProblemStatementContent;
  jtbd: JtbdContent;
  ost: OstContent;
  rice: RiceContent;
  'decision-log': DecisionLogContent;
};

/**
 * RICE rows gain a server-computed score before they are persisted. The score
 * lives in the JSONB content so every read agrees on the same number.
 */
export const riceScoredEntry = riceEntry.extend({
  score: z.number().nonnegative(),
});
export type RiceScoredEntry = z.infer<typeof riceScoredEntry>;

export const riceScoredContent = z.array(riceScoredEntry);
export type RiceScoredContent = z.infer<typeof riceScoredContent>;

/** Content as persisted: identical to input except RICE carries `score`. */
export type FrameworkContentStored = {
  'problem-statement': ProblemStatementContent;
  jtbd: JtbdContent;
  ost: OstContent;
  rice: RiceScoredContent;
  'decision-log': DecisionLogContent;
};

const inputContentSchemas: {
  [K in FrameworkKey]: z.ZodType<FrameworkContentInput[K]>;
} = {
  'problem-statement': problemStatementContent,
  jtbd: jtbdContent,
  ost: ostContent,
  rice: riceContent,
  'decision-log': decisionLogContent,
};

const storedContentSchemas: {
  [K in FrameworkKey]: z.ZodType<FrameworkContentStored[K]>;
} = {
  'problem-statement': problemStatementContent,
  jtbd: jtbdContent,
  ost: ostContent,
  rice: riceScoredContent,
  'decision-log': decisionLogContent,
};

/**
 * The body is always `{ content }`; the path key decides which shared schema
 * validates that content. Keeping the key out of the body avoids a second
 * source of truth the client could contradict.
 */
export function frameworkBodySchema<K extends FrameworkKey>(key: K) {
  return z.object({ content: inputContentSchemas[key] });
}

/** Re-validates JSONB on the way out, so a bad row is a loud 500, not a lie. */
export function parseStoredContent<K extends FrameworkKey>(
  key: K,
  content: unknown,
): FrameworkContentStored[K] {
  return storedContentSchemas[key].parse(content);
}

const frameworkInstanceBase = z.object({
  id: uuid,
  discoveryId: uuid,
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
});

/** Discriminated on key so `content` keeps its per-framework type on the wire. */
export const frameworkInstanceOutput = z.discriminatedUnion('frameworkKey', [
  frameworkInstanceBase.extend({
    frameworkKey: z.literal('problem-statement'),
    content: problemStatementContent,
  }),
  frameworkInstanceBase.extend({
    frameworkKey: z.literal('jtbd'),
    content: jtbdContent,
  }),
  frameworkInstanceBase.extend({
    frameworkKey: z.literal('ost'),
    content: ostContent,
  }),
  frameworkInstanceBase.extend({
    frameworkKey: z.literal('rice'),
    content: riceScoredContent,
  }),
  frameworkInstanceBase.extend({
    frameworkKey: z.literal('decision-log'),
    content: decisionLogContent,
  }),
]);
export type FrameworkInstanceOutput = z.infer<typeof frameworkInstanceOutput>;

export const frameworkListOutput = z.object({
  items: z.array(frameworkInstanceOutput),
});
export type FrameworkListOutput = z.infer<typeof frameworkListOutput>;
