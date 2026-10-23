import { Route, Routes } from 'react-router';
import { AdminBrokersPage } from './AdminBrokersPage';
import { AdminInboundPage } from './AdminInboundPage';
import { AdminLayout } from './AdminLayout';
import { AdminOutboxPage } from './AdminOutboxPage';
import { AdminStatsPage } from './AdminStatsPage';

/** Lazy-loaded admin area, mounted under /app/admin/*. */
export default function AdminArea() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<AdminStatsPage />} />
        <Route path="broker" element={<AdminBrokersPage />} />
        <Route path="posta-non-abbinata" element={<AdminInboundPage />} />
        <Route path="posta-inviata" element={<AdminOutboxPage />} />
      </Route>
    </Routes>
  );
}
