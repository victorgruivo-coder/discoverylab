import { Outlet } from 'react-router-dom';

import { AppShell } from '@/components/layout/AppShell';

/** Route layout: renders the persistent shell around every page. */
export function Layout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
