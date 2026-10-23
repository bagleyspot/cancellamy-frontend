import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router';
import { it } from '@/i18n/it';
import { SkeletonList } from '@/components/ui/Skeleton';
import { FeatureRoute } from '@/components/FeatureRoute';
import { AccessPage } from '@/features/access/AccessPage';
import { AdminRoute } from '@/features/auth/routes';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { DelistingPage } from '@/features/delisting/DelistingPage';
import { NotificationsPage } from '@/features/notifications/NotificationsPage';
import { NuisancePage } from '@/features/nuisance/NuisancePage';
import { CreateProfilePage } from '@/features/profiles/CreateProfilePage';
import { ProfilePage } from '@/features/profiles/ProfilePage';
import { ProfilesPage } from '@/features/profiles/ProfilesPage';
import { NotFoundPage } from '@/features/public/NotFoundPage';
import { ReportsPage } from '@/features/reports/ReportsPage';
import { CustomRequestPage } from '@/features/requests/CustomRequestPage';
import { RequestDetailPage } from '@/features/requests/RequestDetailPage';
import { RequestsPage } from '@/features/requests/RequestsPage';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { AppLayout } from './AppLayout';

const AdminArea = lazy(() => import('@/features/admin/AdminArea'));

/** The authenticated area, mounted under /app/* and lazy-loaded as one chunk. */
export default function AppArea() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="richieste" element={<RequestsPage />} />
        <Route path="richieste/nuova" element={<CustomRequestPage />} />
        <Route path="richieste/:id" element={<RequestDetailPage />} />
        <Route
          path="accesso"
          element={
            <FeatureRoute feature="accessRequests">
              <AccessPage />
            </FeatureRoute>
          }
        />
        <Route
          path="deindicizzazione"
          element={
            <FeatureRoute feature="delisting">
              <DelistingPage />
            </FeatureRoute>
          }
        />
        <Route
          path="telemarketing"
          element={
            <FeatureRoute feature="nuisance">
              <NuisancePage />
            </FeatureRoute>
          }
        />
        <Route path="profili" element={<ProfilesPage />} />
        <Route path="profili/nuovo" element={<CreateProfilePage />} />
        <Route path="profili/:id" element={<ProfilePage />} />
        <Route path="report" element={<ReportsPage />} />
        <Route path="notifiche" element={<NotificationsPage />} />
        <Route path="impostazioni" element={<SettingsPage />} />
        <Route
          path="admin/*"
          element={
            <AdminRoute>
              <Suspense fallback={<SkeletonList label={it.common.loading} />}>
                <AdminArea />
              </Suspense>
            </AdminRoute>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
