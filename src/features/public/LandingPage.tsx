import { ArrowRight, CheckCircle2, Clock, Lock, Scale, ShieldAlert, ShieldCheck, Trophy } from 'lucide-react';
import { Link } from 'react-router';
import { useBrokerStats, useFeatures } from '@/api/queries';
import { it } from '@/i18n/it';
import { formatNumber } from '@/lib/format';
import { ButtonLink } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton';
import { Steps } from './Steps';

function HeroPreview() {
  const rows = [
    { name: 'Informazioni Commerciali IT', ref: 'CNC-8F4A2C', status: 'Completata', tone: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30', meta: 'Cancellazione confermata' },
    { name: 'Elenco Telefonico Nazionale', ref: 'CNC-3B9D1E', status: 'Inviata', tone: 'text-blue-400 bg-blue-500/15 border-blue-500/30', meta: 'Scadenza 30 gg · -18 giorni' },
    { name: 'Arricchimento B2B Marketing', ref: 'CNC-7K2P9Q', status: 'Sollecito', tone: 'text-amber-300 bg-amber-500/15 border-amber-500/30', meta: 'Art. 12.3 GDPR · Sollecito pronto' },
  ] as const;

  return (
    <div aria-hidden="true" className="relative rounded-xl border border-slate-800 bg-slate-900/90 p-5 text-slate-100 shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <span className="font-mono text-xs font-medium text-slate-300">Motore richieste GDPR</span>
        </div>
        <span className="rounded-md border border-blue-500/30 bg-blue-500/15 px-2 py-0.5 font-mono text-[11px] font-medium text-blue-300">
          Termine legale: 30 giorni
        </span>
      </div>

      <div className="mt-4 space-y-2.5">
        {rows.map((row) => (
          <div key={row.ref} className="flex items-center justify-between gap-3 rounded-lg border border-slate-800/90 bg-slate-950/70 px-3.5 py-2.5">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate text-xs font-semibold text-slate-100">{row.name}</p>
                <span className="font-mono text-[10px] text-slate-400">{row.ref}</span>
              </div>
              <p className="mt-0.5 text-[11px] text-slate-400">{row.meta}</p>
            </div>
            <span className={`shrink-0 rounded-md border px-2 py-0.5 text-[11px] font-medium ${row.tone}`}>
              {row.status}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5 border-t border-slate-800 pt-3.5 text-[11px] text-slate-300">
        <div className="flex items-center gap-2 rounded-lg bg-slate-950/60 px-3 py-2">
          <Lock className="h-3.5 w-3.5 shrink-0 text-blue-400" />
          <span>Dati cifrati AES-256-GCM</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-slate-950/60 px-3 py-2">
          <Scale className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
          <span>Dossier + Reclamo Garante</span>
        </div>
      </div>
    </div>
  );
}

function Counters() {
  const query = useBrokerStats();
  const t = it.landing.counters;

  if (query.isPending) {
    return (
      <SkeletonGroup label={it.common.loading} className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((index) => (
          <Skeleton key={index} className="h-36 rounded-xl" />
        ))}
      </SkeletonGroup>
    );
  }
  if (query.isError) return <ErrorState message={t.error} onRetry={() => void query.refetch()} />;

  const stats = [
    { label: t.total, value: query.data.total, foot: 'Mappati con provenienza e licenza' },
    { label: t.sendable, value: query.data.sendable, foot: 'Recapiti verificati sul sito ufficiale' },
    { label: t.italySpecific, value: query.data.italySpecific, foot: 'Soggetti italiani ed europei' },
  ];
  return (
    <dl className="grid gap-4 sm:grid-cols-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex flex-col justify-between rounded-xl border border-primary/15 bg-primary-soft/55 p-6"
        >
          <div>
            <dd className="text-4xl font-extrabold tracking-[-0.03em] tabular-nums text-fg sm:text-5xl">
              {formatNumber(stat.value)}
            </dd>
            <dt className="mt-2 text-sm font-medium text-fg">{stat.label}</dt>
          </div>
          <p className="mt-6 border-t border-primary/10 pt-3 font-mono text-[11px] text-muted">{stat.foot}</p>
        </div>
      ))}
    </dl>
  );
}

function Coverage() {
  const query = useBrokerStats();
  const t = it.landing.coverage;
  const top = query.data ? [...query.data.byCategory].sort((a, b) => b.count - a.count).slice(0, 8) : [];
  return (
    <section aria-labelledby="copertura" className="mx-auto max-w-6xl space-y-6 px-4 py-16 sm:px-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="max-w-2xl space-y-2">
          <h2 id="copertura" className="text-2xl font-bold tracking-[-0.025em] sm:text-3xl">
            {t.title}
          </h2>
          <p className="text-sm leading-relaxed text-muted sm:text-base">{t.body}</p>
        </div>
        <Link to="/broker" className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
          {t.browse}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
      {top.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">{t.categoriesTitle}</h3>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {top.map((entry) => (
              <li
                key={entry.category}
                className="flex items-center justify-between rounded-xl border border-line bg-surface px-4 py-3.5 shadow-2xs transition-colors hover:border-primary/40"
              >
                <p className="text-sm font-semibold text-fg">{it.categories[entry.category]}</p>
                <span className="rounded-md bg-sunken px-2 py-0.5 font-mono text-xs font-medium text-muted">
                  {t.count(entry.count)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function LeaderboardTeaser() {
  const t = it.leaderboard;
  return (
    <section aria-labelledby="classifica" className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
      <Card className="flex flex-col gap-5 border-primary/20 bg-gradient-to-r from-primary-soft/60 via-surface to-surface p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div className="space-y-2">
          <h2 id="classifica" className="flex items-center gap-2.5 text-xl font-bold tracking-[-0.02em] sm:text-2xl">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-fg">
              <Trophy className="h-5 w-5" aria-hidden="true" />
            </span>
            {t.teaserTitle}
          </h2>
          <p className="max-w-2xl text-sm leading-relaxed text-muted">{t.teaserBody}</p>
        </div>
        <ButtonLink to="/classifica" variant="secondary" className="shrink-0">
          {t.teaserCta}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </ButtonLink>
      </Card>
    </section>
  );
}

export function LandingPage() {
  const t = it.landing;
  const { features } = useFeatures();
  return (
    <>
      <section className="cnc-hero-backdrop border-b border-slate-800 px-4 py-12 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-10 rounded-2xl border border-slate-800/90 bg-slate-950/65 p-6 shadow-2xl backdrop-blur-sm sm:p-10 lg:grid-cols-12 lg:p-12">
            <div className="space-y-6 lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-300">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                <span>Open Source (AGPL-3.0) · Artt. 15, 17 e 21 GDPR</span>
              </div>
              <h1 className="text-3xl font-extrabold leading-[1.12] tracking-[-0.03em] text-white sm:text-5xl">
                {t.heroTitle}{' '}
                <span className="bg-gradient-to-r from-blue-400 to-emerald-300 bg-clip-text text-transparent">
                  {t.heroHighlight}
                </span>
              </h1>
              <p className="max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">{t.heroBody}</p>
              <ul className="grid gap-2 text-xs text-slate-300 sm:grid-cols-2 sm:text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
                  <span>Invio automatico e solleciti a 30 giorni</span>
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="h-4 w-4 shrink-0 text-blue-400" aria-hidden="true" />
                  <span>Rinnovi ciclici e bozza reclamo Garante</span>
                </li>
              </ul>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <ButtonLink to="/registrati" className="bg-blue-600 text-white hover:bg-blue-500">
                  {t.ctaPrimary}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </ButtonLink>
                <ButtonLink
                  to="/broker"
                  variant="inverse"
                  className="border-slate-700 bg-slate-900 text-white hover:border-slate-600 hover:bg-slate-800"
                >
                  {t.ctaSecondary}
                </ButtonLink>
              </div>
              <p className="text-xs text-slate-400">{t.heroNote}</p>
            </div>
            <div className="lg:col-span-5">
              <HeroPreview />
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="numeri" className="mx-auto max-w-6xl space-y-6 px-4 py-16 sm:px-6">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <h2 id="numeri" className="text-2xl font-bold tracking-[-0.025em] sm:text-3xl">
            {t.counters.title}
          </h2>
          <p className="font-mono text-xs text-muted">Provenienza documentata · Zero fonti CC BY-NC-SA</p>
        </div>
        <Counters />
      </section>

      <section aria-labelledby="passi" className="border-y border-line bg-sunken/55">
        <div className="mx-auto max-w-6xl space-y-8 px-4 py-16 sm:px-6">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <h2 id="passi" className="text-2xl font-bold tracking-[-0.025em] sm:text-3xl">
              {t.steps.title}
            </h2>
            <Link to="/come-funziona" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
              {t.steps.linkLabel}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <Steps items={t.steps.items} />
        </div>
      </section>

      <Coverage />

      {features.leaderboard && <LeaderboardTeaser />}

      <section aria-labelledby="limiti" className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <Card className="space-y-4 border-line bg-sunken/70 p-6 sm:p-8">
          <h2 id="limiti" className="flex items-center gap-2.5 text-xl font-bold tracking-[-0.02em] sm:text-2xl">
            <ShieldAlert className="h-5 w-5 text-warning" aria-hidden="true" />
            {t.limits.title}
          </h2>
          <p className="text-sm text-muted sm:text-base">{t.limits.intro}</p>
          <ul className="grid gap-2.5 text-sm text-fg sm:grid-cols-2">
            {t.limits.items.map((item) => (
              <li key={item} className="flex items-start gap-2.5 rounded-lg border border-line bg-surface p-3.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-warning" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <section aria-labelledby="faq" className="mx-auto max-w-4xl space-y-6 px-4 pb-16 sm:px-6">
        <h2 id="faq" className="text-2xl font-bold tracking-[-0.025em] sm:text-3xl">
          {t.faq.title}
        </h2>
        <div className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
          {t.faq.items.map((item) => (
            <details key={item.q} className="group p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-fg marker:hidden sm:text-base">
                <span>{item.q}</span>
                <span className="font-mono text-xs text-muted transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-2.5 text-sm leading-relaxed text-muted">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="cnc-hero-backdrop border-t border-slate-800 text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-14 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="space-y-1.5">
            <h2 className="text-2xl font-bold tracking-[-0.025em] text-white sm:text-3xl">{t.finalCta.title}</h2>
            <p className="text-sm text-slate-300 sm:text-base">{t.finalCta.body}</p>
          </div>
          <ButtonLink to="/registrati" className="shrink-0 bg-blue-600 text-white hover:bg-blue-500">
            {t.ctaPrimary}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </ButtonLink>
        </div>
      </section>
    </>
  );
}
