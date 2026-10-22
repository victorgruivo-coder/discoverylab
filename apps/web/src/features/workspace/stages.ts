/** Stage metadata shared by the sidebar and the active-stage switch. */
export const STAGES = [
  { key: 'problem-statement', label: 'Frame', formName: 'Problem Statement' },
  { key: 'jtbd', label: 'Understand', formName: 'Jobs To Be Done' },
  { key: 'ost', label: 'Explore', formName: 'Opportunity Solution Tree' },
  { key: 'rice', label: 'Prioritize', formName: 'RICE' },
  { key: 'decision-log', label: 'Decide', formName: 'Decision Log' },
] as const;

export type StageKey = (typeof STAGES)[number]['key'];
export type Stage = (typeof STAGES)[number];

export const DEFAULT_STAGE: StageKey = 'problem-statement';

export function isStageKey(value: string | null): value is StageKey {
  return STAGES.some((stage) => stage.key === value);
}

/**
 * The URL is the single source of truth for the active stage. An absent or
 * malformed `stage` param falls back to the first stage without rewriting the
 * URL, so a stale bookmark still lands somewhere usable.
 */
export function getActiveStage(searchParams: URLSearchParams): StageKey {
  const value = searchParams.get('stage');

  return isStageKey(value) ? value : DEFAULT_STAGE;
}

export function getStage(key: StageKey): Stage {
  return STAGES.find((stage) => stage.key === key) ?? STAGES[0];
}
