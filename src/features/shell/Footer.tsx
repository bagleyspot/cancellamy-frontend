import { Link } from 'react-router';
import { useFeatures } from '@/api/queries';
import { it } from '@/i18n/it';
import { ExternalLink } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';

export function Footer() {
  const t = it.footer;
  const { features } = useFeatures();
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-12 sm:px-6">
        <div className="space-y-3 sm:col-span-5">
          <Logo />
          <p className="max-w-sm text-sm leading-relaxed text-muted">{t.tagline}</p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="inline-flex items-center rounded-md border border-line bg-sunken px-2 py-0.5 font-mono text-[11px] font-medium text-muted">
              AGPL-3.0-only
            </span>
            <span className="inline-flex items-center rounded-md border border-line bg-sunken px-2 py-0.5 font-mono text-[11px] font-medium text-muted">
              Artt. 15 · 17 · 21 GDPR
            </span>
          </div>
        </div>
        <nav aria-label={t.product} className="space-y-2.5 text-sm sm:col-span-3 sm:col-start-7">
          <p className="text-xs font-semibold uppercase tracking-wider text-fg">{t.product}</p>
          <ul className="space-y-2">
            <li>
              <Link to="/come-funziona" className="text-muted transition-colors hover:text-fg">
                {it.nav.howItWorks}
              </Link>
            </li>
            <li>
              <Link to="/broker" className="text-muted transition-colors hover:text-fg">
                {it.nav.brokers}
              </Link>
            </li>
            {features.leaderboard && (
              <li>
                <Link to="/classifica" className="text-muted transition-colors hover:text-fg">
                  {it.nav.leaderboard}
                </Link>
              </li>
            )}
            <li>
              <Link to="/registrati" className="text-muted transition-colors hover:text-fg">
                {it.nav.register}
              </Link>
            </li>
          </ul>
        </nav>
        <nav aria-label={t.legal} className="space-y-2.5 text-sm sm:col-span-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-fg">{t.legal}</p>
          <ul className="space-y-2">
            <li>
              <Link to="/privacy" className="text-muted transition-colors hover:text-fg">
                {it.nav.privacy}
              </Link>
            </li>
            <li>
              <Link to="/termini" className="text-muted transition-colors hover:text-fg">
                {it.nav.terms}
              </Link>
            </li>
            <li>
              <ExternalLink href={it.brand.githubUrl} className="text-muted no-underline transition-colors hover:text-fg">
                {t.source}
                <span className="sr-only"> {it.common.externalLink}</span>
              </ExternalLink>
            </li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-line bg-sunken/50 px-4 py-5 text-xs text-muted sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
          <p>
            {t.license} {t.legalNote}
          </p>
          <p className="shrink-0 font-medium">{t.rights(new Date().getFullYear())}</p>
        </div>
      </div>
    </footer>
  );
}
