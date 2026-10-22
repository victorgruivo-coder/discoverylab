import { type ReactNode } from 'react';

import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';

/**
 * The shell owns the viewport height. The sidebar and header stay put; only
 * the main content scrolls (and pages such as the workspace can own a nested
 * scroll region without moving the app chrome).
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900">
      <Sidebar />

      <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        <Header />

        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 py-8 lg:px-8">
          <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
