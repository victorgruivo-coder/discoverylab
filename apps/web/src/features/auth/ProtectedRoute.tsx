import { Loader2 } from 'lucide-react';
import { Navigate, useLocation } from 'react-router-dom';

import { useAuth } from '@/features/auth/AuthContext';

import type { ReactNode } from 'react';

/**
 * Blocks private routes until `/auth/me` settles. While the session check is
 * in flight we render a loader instead of redirecting, so a refresh does not
 * bounce an authenticated user to `/login`.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2
          className="size-6 animate-spin text-slate-400"
          aria-hidden="true"
        />
        <span className="sr-only">Loading your session…</span>
      </div>
    );
  }

  if (user === null) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
