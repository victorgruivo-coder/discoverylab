import { Link, useLocation, useSearchParams } from 'react-router-dom';

import { cn } from '@/lib/utils';

import { STAGES, getActiveStage } from './stages';

/**
 * Stage selection lives in the URL (`?stage=jtbd`), so refresh, back/forward,
 * and shared links all reopen the same stage.
 */
export function StageNav() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const activeStage = getActiveStage(searchParams);

  return (
    <nav
      aria-label="Discovery stages"
      className="lg:max-h-full lg:self-start lg:overflow-y-auto"
    >
      <p className="mb-2 px-3 text-xs font-medium tracking-wider text-slate-500 uppercase">
        Stages
      </p>

      <ol className="space-y-1">
        {STAGES.map((stage, index) => {
          const isActive = stage.key === activeStage;

          return (
            <li key={stage.key}>
              <Link
                to={{
                  pathname: location.pathname,
                  search: `?stage=${stage.key}`,
                }}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:outline-none',
                  isActive
                    ? 'border-slate-900 bg-slate-900 font-medium text-white shadow-sm'
                    : 'border-transparent text-slate-600 hover:bg-white hover:text-slate-900',
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'flex size-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-medium',
                    isActive
                      ? 'border-white/30 text-white'
                      : 'border-slate-300 text-slate-500',
                  )}
                >
                  {index + 1}
                </span>

                <span className="flex min-w-0 flex-col">
                  <span>{stage.label}</span>
                  <span
                    className={cn(
                      'truncate text-[11px]',
                      isActive ? 'text-slate-300' : 'text-slate-400',
                    )}
                  >
                    {stage.formName}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
