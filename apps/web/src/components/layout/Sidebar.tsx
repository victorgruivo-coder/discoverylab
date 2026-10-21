import {
  Compass,
  FlaskConical,
  LayoutDashboard,
  LogOut,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
};

const navItems: ReadonlyArray<NavItem> = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/discoveries', label: 'Discoveries', icon: Compass },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  return (
    <aside className="sticky top-0 flex h-screen w-[250px] shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="flex h-16 items-center border-b border-slate-100 px-4">
        <Link
          to="/"
          className="flex items-center gap-2.5 rounded-md focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:outline-none"
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-slate-900 text-white shadow-sm">
            <FlaskConical className="size-4" aria-hidden="true" />
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-slate-900">
            DiscoveryLab
          </span>
        </Link>
      </div>

      <nav
        aria-label="Main navigation"
        className="flex-1 space-y-1 overflow-y-auto px-3 py-4"
      >
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end ?? false}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-slate-100 font-medium text-slate-900'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
              )
            }
          >
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-200 p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <Avatar className="size-8">
            <AvatarFallback className="bg-slate-900 text-xs font-medium text-white">
              AM
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-900">
              Alex Morgan
            </p>
            <p className="truncate text-xs text-slate-500">Product Manager</p>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Log out"
            title="Log out"
          >
            <LogOut className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
