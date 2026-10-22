import { CalendarDays, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';

import type { DiscoveryOutput, DiscoveryStatus } from '@discoverylab/shared';

import { Badge } from '@/components/ui/badge';
import { formatEnumLabel, formatIsoDate } from '@/lib/format';
import { cn } from '@/lib/utils';

const statusStyles: Record<DiscoveryStatus, string> = {
  draft: 'border-slate-200 bg-slate-100 text-slate-600',
  active: 'border-emerald-200 bg-emerald-100 text-emerald-700',
  completed: 'border-blue-200 bg-blue-100 text-blue-700',
  archived: 'border-amber-200 bg-amber-100 text-amber-700',
};

const typeStyles = 'border-slate-200 bg-white text-slate-600';

export function DiscoveryCard({
  discovery,
  compact = false,
}: {
  discovery: DiscoveryOutput;
  compact?: boolean;
}) {
  return (
    <Link
      to={`/discoveries/${discovery.id}`}
      aria-label={`Open ${discovery.name}`}
      className={cn(
        'group flex h-full flex-col rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:outline-none',
        compact && 'rounded-lg',
      )}
    >
      <article className={cn('flex flex-1 flex-col', compact ? 'p-4' : 'p-5')}>
        <div className="flex items-start justify-between gap-3">
          <h3
            className={cn(
              'leading-snug font-semibold tracking-tight text-slate-900',
              compact ? 'text-sm' : 'text-base',
            )}
          >
            {discovery.name}
          </h3>
          <Badge
            variant="outline"
            className={cn(
              'shrink-0 capitalize',
              compact && 'text-[10px]',
              statusStyles[discovery.status],
            )}
          >
            {formatEnumLabel(discovery.status)}
          </Badge>
        </div>

        <div
          className={cn(
            'flex flex-wrap items-center gap-2',
            compact ? 'mt-2' : 'mt-3',
          )}
        >
          <Badge
            variant="outline"
            className={cn('capitalize', compact && 'text-[10px]', typeStyles)}
          >
            {formatEnumLabel(discovery.type)}
          </Badge>
        </div>

        <div
          className={cn(
            'flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 text-slate-500',
            compact ? 'mt-4 pt-3 text-[11px]' : 'mt-5 pt-4 text-xs',
          )}
        >
          <span className="inline-flex items-center gap-1.5">
            <UserRound className="size-3.5" aria-hidden="true" />
            Lead: {discovery.leadName ?? 'Unassigned'}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="size-3.5" aria-hidden="true" />
            {formatIsoDate(discovery.startDate)}
          </span>
        </div>
      </article>
    </Link>
  );
}
