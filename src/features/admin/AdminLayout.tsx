import { NavLink, Outlet } from 'react-router';
import { it } from '@/i18n/it';
import { cn } from '@/lib/cn';
import { PageHeader } from '@/components/ui/PageHeader';

const TABS = [
  { to: '/app/admin', label: it.nav.adminStats, end: true },
  { to: '/app/admin/broker', label: it.nav.adminBrokers, end: false },
  { to: '/app/admin/posta-non-abbinata', label: it.nav.adminInbound, end: false },
  { to: '/app/admin/posta-inviata', label: it.nav.adminOutbox, end: false },
] as const;

export function AdminLayout() {
  return (
    <div className="space-y-6">
      <PageHeader title={it.admin.title} />
      <nav aria-label={it.admin.title} className="inline-flex max-w-full gap-1 overflow-x-auto rounded-lg border border-line bg-sunken/80 p-1">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              cn(
                'flex min-h-9 shrink-0 items-center rounded-md px-3.5 text-sm font-medium transition-all',
                isActive ? 'bg-surface text-fg shadow-2xs ring-1 ring-line' : 'text-muted hover:text-fg',
              )
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}
