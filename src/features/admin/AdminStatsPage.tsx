import { useAdminStats } from '@/api/queries';
import { it } from '@/i18n/it';
import { formatNumber } from '@/lib/format';
import { Badge } from '@/components/ui/Badge';
import { Card, CardTitle } from '@/components/ui/Card';
import { QueryBoundary } from '@/components/ui/QueryBoundary';
import { StatusBadge } from '@/features/requests/StatusBadge';

export function AdminStatsPage() {
  const t = it.admin.stats;
  const query = useAdminStats();
  return (
    <QueryBoundary query={query} errorMessage={it.admin.loadError}>
      {(stats) => {
        const cards = [
          { label: t.users, value: stats.users },
          { label: t.profiles, value: stats.profiles },
          { label: t.activeProfiles, value: stats.activeProfiles },
          { label: t.messagesOut, value: stats.messagesOut },
          { label: t.messagesIn, value: stats.messagesIn },
          { label: t.unmatched, value: stats.unmatchedInbound },
        ];
        return (
          <div className="space-y-6">
            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {cards.map((card) => (
                <Card key={card.label}>
                  <dt className="text-sm text-muted">{card.label}</dt>
                  <dd className="text-3xl font-semibold tabular-nums">{formatNumber(card.value)}</dd>
                </Card>
              ))}
            </dl>
            <Card className="space-y-3">
              <CardTitle>{t.mailMode}</CardTitle>
              <Badge tone={stats.mailMode === 'dry-run' ? 'warning' : 'success'}>{t.mailModes[stats.mailMode]}</Badge>
            </Card>
            <Card className="space-y-3">
              <CardTitle>{t.byStatus}</CardTitle>
              <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {stats.requestsByStatus.map((entry) => (
                  <li key={entry.status} className="flex items-center justify-between gap-2 rounded-xl bg-sunken px-3 py-2">
                    <StatusBadge status={entry.status} />
                    <span className="font-semibold tabular-nums">{formatNumber(entry.count)}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        );
      }}
    </QueryBoundary>
  );
}
