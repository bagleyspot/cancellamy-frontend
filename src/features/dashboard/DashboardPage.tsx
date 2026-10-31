import { AlertCircle, Ban, CheckCircle2, Clock, Send } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router';
import { useRequests, useSummary } from '@/api/queries';
import type { RequestGroup, SummaryDto } from '@/api/types';
import { it } from '@/i18n/it';
import { cn } from '@/lib/cn';
import { formatDateTime, formatNumber } from '@/lib/format';
import { Badge } from '@/components/ui/Badge';
import { BarChart } from '@/components/ui/BarChart';
import { ButtonLink } from '@/components/ui/Button';
import { Card, CardTitle } from '@/components/ui/Card';
import { ErrorState } from '@/components/ui/ErrorState';
import { PageHeader } from '@/components/ui/PageHeader';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { QueryBoundary } from '@/components/ui/QueryBoundary';
import { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton';
import { NoProfile } from '@/features/profiles/NoProfile';
import { RequestRow } from '@/features/requests/RequestRow';
import { useSelectedProfile } from '@/features/shell/ProfileContext';

const GROUP_CARDS: { group: RequestGroup; icon: LucideIcon; accent: string }[] = [
  { group: 'to_send', icon: Send, accent: 'text-accent' },
  { group: 'in_progress', icon: Clock, accent: 'text-primary' },
  { group: 'action_required', icon: AlertCircle, accent: 'text-accent' },
  { group: 'completed', icon: CheckCircle2, accent: 'text-success' },
  { group: 'not_removable', icon: Ban, accent: 'text-muted' },
];

function countFor(group: RequestGroup, counts: SummaryDto['counts']): number {
  switch (group) {
    case 'to_send':
      return counts.toSend;
    case 'in_progress':
      return counts.inProgress;
    case 'action_required':
      return counts.actionRequired;
    case 'completed':
      return counts.completed;
    case 'not_removable':
      return counts.notRemovable;
  }
}

function DashboardSkeleton() {
  return (
    <SkeletonGroup label={it.common.loading} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((index) => (
          <Skeleton key={index} className="h-28 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-56 rounded-2xl" />
    </SkeletonGroup>
  );
}

function ActionRequiredList({ profileId }: { profileId: string }) {
  const t = it.dashboard;
  const query = useRequests({ profileId, group: 'action_required', limit: 5 });
  return (
    <Card className="space-y-4 border-accent/40">
      <div className="flex items-center justify-between gap-3">
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-accent" aria-hidden="true" />
          {t.actionsTitle}
        </CardTitle>
        <Link to="/app/richieste?group=action_required" className="text-sm font-medium text-primary underline underline-offset-2">
          {t.actionsAll}
        </Link>
      </div>
      <QueryBoundary query={query}>
        {(data) =>
          data.items.length === 0 ? (
            <p className="text-sm text-muted">{t.actionsNone}</p>
          ) : (
            <>
              <p className="text-sm text-muted">{t.actionsBody}</p>
              <ul className="space-y-3">
                {data.items.map((item) => (
                  <RequestRow key={item.id} item={item} />
                ))}
              </ul>
            </>
          )
        }
      </QueryBoundary>
    </Card>
  );
}

function SummaryView({ summary, profileId }: { summary: SummaryDto; profileId: string }) {
  const t = it.dashboard;
  const categories = [...summary.byCategory].sort((a, b) => b.total - a.total).slice(0, 6);
  return (
    <div className="space-y-6">
      <section aria-label={t.countersTitle}>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {GROUP_CARDS.filter(({ group }) => group !== 'to_send' || summary.counts.toSend > 0).map(({ group, icon: Icon, accent }) => (
            <li key={group}>
              <Link
                to={`/app/richieste?group=${group}`}
                className="flex h-full flex-col justify-between rounded-xl border border-line bg-surface p-5 shadow-2xs transition-all hover:border-primary/50 hover:shadow-sm"
              >
                <div className="flex items-center justify-between gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
                  <span>{it.status.group[group]}</span>
                  <Icon className={cn('h-4 w-4 shrink-0', accent)} aria-hidden="true" />
                </div>
                <div className="mt-3">
                  <p className="text-3xl font-extrabold tracking-[-0.03em] tabular-nums text-fg">
                    {formatNumber(countFor(group, summary.counts))}
                  </p>
                  <p className="mt-0.5 font-mono text-[11px] text-muted">{t.total(summary.counts.total)}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <ActionRequiredList profileId={profileId} />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="flex flex-col items-center gap-4 text-center">
          <CardTitle>{t.completionTitle}</CardTitle>
          <ProgressRing value={summary.completionRate} label={t.completionLabel} />
          <p className="text-xs text-muted">{t.completionHint}</p>
        </Card>
        <Card className="space-y-4">
          <CardTitle>{t.coverageTitle}</CardTitle>
          <dl className="space-y-3">
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-sm text-muted">{t.tracked}</dt>
              <dd className="text-xl font-semibold tabular-nums">{formatNumber(summary.coverage.brokersTracked)}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-sm text-muted">{t.covered}</dt>
              <dd className="text-xl font-semibold tabular-nums text-primary">{formatNumber(summary.coverage.brokersCovered)}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-sm text-muted">{t.notCovered}</dt>
              <dd className="text-xl font-semibold tabular-nums">{formatNumber(summary.coverage.brokersNotYetCovered)}</dd>
            </div>
          </dl>
        </Card>
        <Card className="space-y-3">
          <CardTitle>{t.byCategoryTitle}</CardTitle>
          {categories.length === 0 ? (
            <p className="text-sm text-muted">{t.recentEmpty}</p>
          ) : (
            <ul className="space-y-3">
              {categories.map((entry) => (
                <li key={entry.category} className="space-y-1">
                  <div className="flex justify-between gap-2 text-sm">
                    <span>{it.categories[entry.category]}</span>
                    <span className="text-muted">{t.byCategoryItem(entry.completed, entry.total)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-sunken" aria-hidden="true">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${entry.total > 0 ? (entry.completed / entry.total) * 100 : 0}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-4">
          <CardTitle>{t.byMonthTitle}</CardTitle>
          <BarChart data={summary.completedByMonth} caption={t.byMonthCaption} countLabel={t.byMonthCount} monthLabel={t.month} />
        </Card>
        <Card className="space-y-4">
          <CardTitle>{t.recentTitle}</CardTitle>
          {summary.recentActivity.length === 0 ? (
            <p className="text-sm text-muted">{t.recentEmpty}</p>
          ) : (
            <ul className="divide-y divide-line">
              {summary.recentActivity.map((entry, index) => (
                <li key={`${entry.requestId}-${entry.at}-${index}`} className="py-2.5 first:pt-0 last:pb-0">
                  <Link to={`/app/richieste/${entry.requestId}`} className="block space-y-0.5 rounded-lg hover:bg-sunken">
                    <p className="text-sm font-medium">{entry.brokerName}</p>
                    <p className="text-sm text-muted">{entry.text}</p>
                    <p className="text-xs text-muted">
                      <time dateTime={entry.at}>{formatDateTime(entry.at)}</time>
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const t = it.dashboard;
  const { selected, isLoading, isError, retry } = useSelectedProfile();
  const summary = useSummary(selected?.id, selected !== undefined);

  if (isLoading) return <DashboardSkeleton />;
  if (isError) return <ErrorState message={it.shell.profilesLoadError} onRetry={retry} />;
  if (!selected) {
    return (
      <div className="space-y-6">
        <PageHeader title={t.title} />
        <NoProfile />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.title}
        description={t.subtitle(`${selected.firstName} ${selected.lastName}`)}
        actions={
          selected.status === 'paused' ? <Badge tone="warning">{it.status.profile.paused}</Badge> : selected.status === 'draft' || selected.status === 'ready' ? (
            <ButtonLink to={`/app/profili/${selected.id}`} variant="accent">
              {it.profiles.completeSetup}
            </ButtonLink>
          ) : undefined
        }
      />
      <QueryBoundary query={summary} errorMessage={t.loadError} skeleton={<DashboardSkeleton />}>
        {(data) => <SummaryView summary={data} profileId={selected.id} />}
      </QueryBoundary>
    </div>
  );
}
