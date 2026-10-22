import {
  Compass,
  FlaskConical,
  LayoutDashboard,
  Loader2,
  LogOut,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/AuthContext';
import { getApiErrorMessage } from '@/lib/api-client';
import { getInitials } from '@/lib/format';
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
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const handleLogout = async (): Promise<void> => {
    setIsLoggingOut(true);
    setLogoutError(null);

    try {
      await logout();
      await navigate('/login', { replace: true });
    } catch (error) {
      setLogoutError(
        getApiErrorMessage(error, 'Unable to log out. Please try again.'),
      );
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <aside className="flex h-full w-[250px] shrink-0 flex-col overflow-y-auto border-r border-slate-200 bg-white">
      <div className="flex h-16 shrink-0 items-center border-b border-slate-100 px-4">
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

      <nav aria-label="Main navigation" className="flex-1 space-y-1 px-3 py-4">
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

      <div className="shrink-0 border-t border-slate-200 p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <Avatar className="size-8">
            <AvatarFallback className="bg-slate-900 text-xs font-medium text-white">
              {user ? getInitials(user.name) : '?'}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-900">
              {user?.name ?? 'Signed in user'}
            </p>
            <p className="truncate text-xs text-slate-500">
              {user?.email ?? ''}
            </p>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Log out"
            title="Log out"
            disabled={isLoggingOut}
            onClick={() => {
              void handleLogout();
            }}
          >
            {isLoggingOut ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <LogOut className="size-4" aria-hidden="true" />
            )}
          </Button>
        </div>

        {logoutError === null ? null : (
          <p role="alert" className="px-2 pt-1 text-xs text-red-600">
            {logoutError}
          </p>
        )}
      </div>
    </aside>
  );
}
