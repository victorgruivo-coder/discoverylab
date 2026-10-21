import { useLocation } from 'react-router-dom';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/discoveries': 'Discoveries',
  '/settings': 'Settings',
};

export function Header() {
  const { pathname } = useLocation();
  const title = pageTitles[pathname] ?? 'DiscoveryLab';

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white/80 px-6 backdrop-blur-sm lg:px-8">
      <h1 className="text-base font-semibold tracking-tight text-slate-900">
        {title}
      </h1>
    </header>
  );
}
