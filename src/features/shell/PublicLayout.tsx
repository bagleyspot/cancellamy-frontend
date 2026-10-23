import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Link, NavLink, Outlet } from 'react-router';
import { useFeatures } from '@/api/queries';
import { it } from '@/i18n/it';
import { cn } from '@/lib/cn';
import { ButtonLink } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { useAuth } from '@/features/auth/auth';
import { DryRunBanner } from './DryRunBanner';
import { Footer } from './Footer';

const BASE_NAV = [
  { to: '/come-funziona', label: it.nav.howItWorks },
  { to: '/broker', label: it.nav.brokers },
] as const;
const LEADERBOARD_NAV = { to: '/classifica', label: it.nav.leaderboard } as const;

function navClass({ isActive }: { isActive: boolean }) {
  return cn(
    'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
    isActive ? 'bg-primary-soft text-primary font-semibold' : 'text-muted hover:bg-sunken hover:text-fg',
  );
}

export function PublicLayout() {
  const { status } = useAuth();
  const { features } = useFeatures();
  const [open, setOpen] = useState(false);
  const nav = features.leaderboard ? [...BASE_NAV, LEADERBOARD_NAV] : BASE_NAV;

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <a href="#contenuto" className="sr-only-focusable absolute left-2 top-2 z-50 rounded-lg bg-surface px-3 py-2 text-sm font-medium shadow-md">
        {it.common.skipToContent}
      </a>
      <DryRunBanner />
      <header className="sticky top-0 z-40 border-b border-line/80 bg-surface/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-8">
            <Link to="/" aria-label={`${it.brand.name}: ${it.nav.home}`} className="rounded-lg">
              <Logo />
            </Link>
            <nav aria-label={it.nav.mainMenu} className="hidden items-center gap-1 md:flex">
              {nav.map((item) => (
                <NavLink key={item.to} to={item.to} className={navClass}>
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="hidden items-center gap-2.5 md:flex">
            {status === 'authenticated' ? (
              <ButtonLink to="/app" size="sm">{it.nav.goToApp}</ButtonLink>
            ) : (
              <>
                <ButtonLink to="/accedi" variant="ghost" size="sm">
                  {it.nav.login}
                </ButtonLink>
                <ButtonLink to="/registrati" size="sm">{it.nav.register}</ButtonLink>
              </>
            )}
          </div>
          <button
            type="button"
            className="-mr-2 rounded-lg p-2 text-muted hover:bg-sunken hover:text-fg md:hidden"
            aria-expanded={open}
            aria-controls="menu-mobile"
            aria-label={open ? it.nav.closeMenu : it.nav.openMenu}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
        {open && (
          <nav id="menu-mobile" aria-label={it.nav.mainMenu} className="space-y-1 border-t border-line bg-surface px-4 py-3 md:hidden">
            {nav.map((item) => (
              <NavLink key={item.to} to={item.to} className={navClass} onClick={() => setOpen(false)}>
                {item.label}
              </NavLink>
            ))}
            <div className="flex flex-col gap-2 pt-2">
              {status === 'authenticated' ? (
                <ButtonLink to="/app" onClick={() => setOpen(false)}>
                  {it.nav.goToApp}
                </ButtonLink>
              ) : (
                <>
                  <ButtonLink to="/accedi" variant="secondary" onClick={() => setOpen(false)}>
                    {it.nav.login}
                  </ButtonLink>
                  <ButtonLink to="/registrati" onClick={() => setOpen(false)}>
                    {it.nav.register}
                  </ButtonLink>
                </>
              )}
            </div>
          </nav>
        )}
      </header>
      <main id="contenuto" tabIndex={-1} className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
