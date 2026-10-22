import { Navigate, Route, Routes } from 'react-router-dom';

import { Layout } from '@/components/layout/Layout';
import { AuthProvider } from '@/features/auth/AuthContext';
import { Login } from '@/features/auth/Login';
import { ProtectedRoute } from '@/features/auth/ProtectedRoute';
import { PublicLayout } from '@/features/auth/PublicLayout';
import { Signup } from '@/features/auth/Signup';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { DiscoveriesPage } from '@/features/discoveries/DiscoveriesPage';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { Workspace } from '@/features/workspace/Workspace';

export function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="login" element={<Login />} />
          <Route path="signup" element={<Signup />} />
        </Route>

        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="discoveries" element={<DiscoveriesPage />} />
          <Route path="discoveries/:id" element={<Workspace />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
