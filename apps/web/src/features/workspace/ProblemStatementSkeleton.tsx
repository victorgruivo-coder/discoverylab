import { PROBLEM_STATEMENT_FIELDS } from './problemStatementForm';

export function ProblemStatementSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading problem statement"
      className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="space-y-5">
        {PROBLEM_STATEMENT_FIELDS.map((config) => (
          <div key={config.name} className="space-y-2">
            <div className="h-3.5 w-32 animate-pulse rounded bg-slate-200" />
            <div className="h-24 animate-pulse rounded-lg bg-slate-100" />
          </div>
        ))}
      </div>
      <span className="sr-only">Loading problem statement…</span>
    </div>
  );
}
