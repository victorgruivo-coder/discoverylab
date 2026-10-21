import { FlaskConical } from 'lucide-react';
import { Link, Outlet } from 'react-router-dom';

/** Public route layout: centered card, no app shell or sidebar. */
export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-12">
      <Link
        to="/"
        className="mb-8 flex items-center gap-2.5 rounded-md focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:outline-none"
      >
        <span className="flex size-9 items-center justify-center rounded-lg bg-slate-900 text-white shadow-sm">
          <FlaskConical className="size-4.5" aria-hidden="true" />
        </span>
        <span className="text-lg font-semibold tracking-tight text-slate-900">
          DiscoveryLab
        </span>
      </Link>

      <main className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <Outlet />
      </main>

      <p className="mt-6 text-center text-xs text-slate-500">
        Structured product discovery, from problem to decision.
      </p>
    </div>
  );
}
