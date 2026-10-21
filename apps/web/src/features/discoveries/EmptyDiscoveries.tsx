import { Compass, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';

export function EmptyDiscoveries({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
        <Compass className="size-7" aria-hidden="true" />
      </span>

      <h2 className="mt-4 text-lg font-semibold tracking-tight text-slate-900">
        No discoveries yet
      </h2>
      <p className="mt-1 max-w-sm text-sm text-slate-500">
        Start with a problem worth solving. DiscoveryLab will guide you from
        framing to a decision.
      </p>

      <Button type="button" className="mt-6" onClick={onCreate}>
        <Plus className="size-4" aria-hidden="true" />
        New discovery
      </Button>
    </div>
  );
}
