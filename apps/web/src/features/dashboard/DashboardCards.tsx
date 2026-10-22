export function StatCard({
  label,
  value,
}: {
  label: string;
  value: number | null;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      {value === null ? (
        <div
          className="mt-3 h-8 w-12 animate-pulse rounded bg-slate-200"
          aria-hidden="true"
        />
      ) : (
        <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
          {value}
        </p>
      )}
    </div>
  );
}

export function RecentSkeleton() {
  return (
    <div
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
      role="status"
      aria-label="Loading recent discoveries"
    >
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className="h-36 animate-pulse rounded-lg border border-slate-200 bg-white"
          aria-hidden="true"
        />
      ))}
      <span className="sr-only">Loading recent discoveries…</span>
    </div>
  );
}
