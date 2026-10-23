import { useState } from 'react';
import { Bell, Eye, FileText, LayoutDashboard, ListChecks, LogOut, Menu, PhoneOff, Search, Settings, ShieldCheck, Users, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router';
import { useFeatures } from '@/api/queries';
import type { FeatureFlags } from '@/api/types';
import { it } from '@/i18n/it';
import { cn } from '@/lib/cn';
import { Logo } from '@/components/ui/Logo';
import { useAuth } from '@/features/auth/auth';
import { DryRunBanner } from './DryRunBanner';
import { EmailVerifyBanner } from './EmailVerifyBanner';
import { NotificationBell } from './NotificationBell';
import { ProfileProvider } from './ProfileContext';
import { ProfileSwitcher } from './ProfileSwitcher';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
  /** Entry shown only when the instance has this feature enabled. */
  feature?: keyof FeatureFlags;
}

const BASE_NAV: NavItem[] = [
  { to: '/app', label: it.nav.dashboard, icon: LayoutDashboard, end: true },
  { to: '/app/richieste', label: it.nav.requests, icon: ListChecks },
  { to: '/app/accesso', label: it.nav.access, icon: Eye, feature: 'accessRequests' },
  { to: '/app/deindicizzazione', label: it.nav.delisting, icon: Search, feature: 'delisting' },
  { to: '/app/telemarketing', label: it.nav.nuisance, icon: PhoneOff, feature: 'nuisance' },
  { to: '/app/profili', label: it.nav.profiles, icon: Users },
  { to: '/app/report', label: it.nav.reports, icon: FileText },
  { to: '/app/notifiche', label: it.nav.notifications, icon: Bell },
  { to: '/app/impostazioni', label: it.nav.settings, icon: Settings },
];

const ADMIN_NAV: NavItem = { to: '/app/admin', label: it.nav.admin, icon: ShieldCheck };

function linkClass({ isActive }: { isActive: boolean }) {
  return cn(
    'flex min-h-9.5 items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
    isActive ? 'bg-primary-soft text-primary font-semibold' : 'text-muted hover:bg-sunken hover:text-fg',
  );
}

function NavList({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  return (
    <ul className="space-y-0.5">
      {items.map((item) => (
        <li key={item.to}>
          <NavLink to={item.to} end={item.end} className={linkClass} onClick={onNavigate}>
            <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            {item.label}
          </NavLink>
        </li>
      ))}
    </ul>
  );
}

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const { features } = useFeatures();
  const visible = BASE_NAV.filter((item) => item.feature === undefined || features[item.feature]);
  const items = user?.role === 'admin' ? [...visible, ADMIN_NAV] : visible;

  const signOut = async () => {
    try {
      await logout();
    } finally {
      void navigate('/accedi', { replace: true });
    }
  };

  return (
    <ProfileProvider>
      <div className="flex min-h-screen flex-col">
        <a href="#contenuto" className="sr-only-focusable absolute left-2 top-2 z-50 rounded-lg bg-surface px-3 py-2 text-sm font-medium">
          {it.common.skipToContent}
        </a>
        <DryRunBanner />
        <div className="flex flex-1">
          <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line bg-surface px-3.5 py-4 lg:flex">
            <Link to="/app" className="mb-6 rounded-lg px-2 py-1" aria-label={`${it.brand.name}: ${it.nav.dashboard}`}>
              <Logo />
            </Link>
            <nav aria-label={it.nav.appMenu} className="flex-1">
              <NavList items={items} />
            </nav>
            <div className="border-t border-line pt-3">
              <button
                type="button"
                onClick={() => void signOut()}
                className="flex min-h-9.5 w-full items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-sunken hover:text-fg"
              >
                <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
                {it.nav.logout}
              </button>
            </div>
          </aside>

          <div className="flex min-w-0 flex-1 flex-col bg-bg">
            <header className="sticky top-0 z-30 border-b border-line bg-surface/85 backdrop-blur-md">
              <div className="flex h-14 items-center justify-between gap-3 px-4 sm:px-6">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="-ml-2 rounded-lg p-2 text-muted hover:bg-sunken hover:text-fg lg:hidden"
                    aria-expanded={menuOpen}
                    aria-controls="menu-app"
                    aria-label={menuOpen ? it.nav.closeMenu : it.nav.openMenu}
                    onClick={() => setMenuOpen((value) => !value)}
                  >
                    {menuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
                  </button>
                  <Link to="/app" className="lg:hidden" aria-label={`${it.brand.name}: ${it.nav.dashboard}`}>
                    <Logo />
                  </Link>
                </div>
                <div className="flex min-w-0 items-center gap-2.5">
                  <ProfileSwitcher />
                  <NotificationBell />
                </div>
              </div>
              {menuOpen && (
                <nav id="menu-app" aria-label={it.nav.appMenu} className="border-t border-line bg-surface p-3 lg:hidden">
                  <NavList items={items} onNavigate={() => setMenuOpen(false)} />
                  <button
                    type="button"
                    onClick={() => void signOut()}
                    className="mt-1 flex min-h-9.5 w-full items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm font-medium text-muted hover:bg-sunken"
                  >
                    <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {it.nav.logout}
                  </button>
                </nav>
              )}
            </header>
            <EmailVerifyBanner />
            <main id="contenuto" tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-6 sm:px-6 sm:py-8">
              <Outlet />
            </main>
          </div>
        </div>
      </div>
    </ProfileProvider>
  );
}
