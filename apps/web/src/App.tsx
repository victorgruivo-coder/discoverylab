import { Route, Routes } from 'react-router-dom';

import { Layout } from '@/components/layout/Layout';
import { LoginPage } from '@/features/auth/LoginPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { DiscoveriesPage } from '@/features/discoveries/DiscoveriesPage';
import { SettingsPage } from '@/features/settings/SettingsPage';

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="discoveries" element={<DiscoveriesPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="login" element={<LoginPage />} />
      </Route>
    </Routes>
  );
}
