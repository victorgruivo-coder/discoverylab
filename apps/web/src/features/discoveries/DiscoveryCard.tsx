import { CalendarDays, UserRound } from 'lucide-react';

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

export function DiscoveryCard({ discovery }: { discovery: DiscoveryOutput }) {
  return (
    <article className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base leading-snug font-semibold tracking-tight text-slate-900">
          {discovery.name}
        </h3>
        <Badge
          variant="outline"
          className={cn('shrink-0 capitalize', statusStyles[discovery.status])}
        >
          {formatEnumLabel(discovery.status)}
        </Badge>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge variant="outline" className={cn('capitalize', typeStyles)}>
          {formatEnumLabel(discovery.type)}
        </Badge>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
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
  );
}
