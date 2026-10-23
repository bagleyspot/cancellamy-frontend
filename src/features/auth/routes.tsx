import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { it } from '@/i18n/it';
import { Spinner } from '@/components/ui/Spinner';
import { useAuth } from './auth';

export function FullPageLoader({ label }: { label: string }) {
  return (
    <div role="status" className="flex min-h-screen items-center justify-center gap-3 text-muted">
      <Spinner className="h-5 w-5" />
      <span>{label}</span>
    </div>
  );
}

export function ProtectedRoute({ children }: { children?: ReactNode }) {
  const { status } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <FullPageLoader label={it.auth.restoring} />;
  if (status === 'anonymous') {
    return <Navigate to="/accedi" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }
  return <>{children ?? <Outlet />}</>;
}

export function AdminRoute({ children }: { children?: ReactNode }) {
  const { user } = useAuth();
  if (user?.role !== 'admin') return <Navigate to="/app" replace />;
  return <>{children ?? <Outlet />}</>;
}

/** The login page bounces signed-in users to where they were going (or the app home). */
export function GuestRoute() {
  const { status } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <FullPageLoader label={it.auth.restoring} />;
  if (status === 'authenticated') {
    const from = (location.state as { from?: string } | null)?.from;
    return <Navigate to={from ?? '/app'} replace />;
  }
  return <Outlet />;
}
