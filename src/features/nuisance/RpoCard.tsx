import type { NuisanceOverviewDto } from '@/api/types';
import { it } from '@/i18n/it';
import { formatDate } from '@/lib/format';
import { Badge } from '@/components/ui/Badge';
import { ButtonLink } from '@/components/ui/Button';
import { Card, CardTitle } from '@/components/ui/Card';

const t = it.nuisance.rpo;

export function RpoCard({ rpo }: { rpo: NuisanceOverviewDto['rpo'] }) {
  return (
    <Card className="space-y-3" aria-labelledby="rpo-title">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <CardTitle id="rpo-title">{t.title}</CardTitle>
        <Badge tone={rpo.registered ? 'success' : 'warning'}>{rpo.registered ? t.registered : t.notRegistered}</Badge>
      </div>
      {rpo.registered ? (
        <div className="space-y-1 text-sm">
          {rpo.completedAt && <p>{t.completedOn(formatDate(rpo.completedAt))}</p>}
          {rpo.effectiveFrom && <p className="text-muted">{t.effectiveFrom(formatDate(rpo.effectiveFrom))}</p>}
        </div>
      ) : (
        <p className="text-sm text-muted">{t.notRegisteredBody}</p>
      )}
      <ButtonLink to={rpo.requestId ? `/app/richieste/${rpo.requestId}` : '/app/richieste'} variant="secondary" size="sm">
        {rpo.requestId ? t.openRequest : t.openRequests}
      </ButtonLink>
    </Card>
  );
}
