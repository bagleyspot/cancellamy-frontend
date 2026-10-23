import { Scale } from 'lucide-react';
import { it } from '@/i18n/it';
import { Alert } from '@/components/ui/Alert';
import { ButtonLink } from '@/components/ui/Button';
import { Card, CardTitle } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { SkeletonList } from '@/components/ui/Skeleton';
import { NoProfile } from '@/features/profiles/NoProfile';
import { useSelectedProfile } from '@/features/shell/ProfileContext';
import { BrokerPicker } from './BrokerPicker';
import { DataMap } from './DataMap';

const t = it.access;

export function AccessPage() {
  const { selected, isLoading } = useSelectedProfile();
  if (isLoading) return <SkeletonList label={it.common.loading} />;
  if (!selected) return <NoProfile />;

  const name = `${selected.firstName} ${selected.lastName}`;
  return (
    <div className="space-y-6">
      <PageHeader title={t.title} description={t.subtitle(name)} />

      <Card className="space-y-3">
        <div className="flex items-center gap-2">
          <Scale className="h-5 w-5 text-primary" aria-hidden="true" />
          <CardTitle>{t.explainTitle}</CardTitle>
        </div>
        <p className="text-sm">{t.explainBody}</p>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-muted">
          {t.explainSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <p className="text-xs text-muted">{t.explainNote}</p>
      </Card>

      {!selected.identityVerified ? (
        <Alert
          tone="warning"
          title={t.blockedTitle}
          actions={
            <ButtonLink to={`/app/profili/${selected.id}#identita`} variant="secondary" size="sm">
              {t.blockedCta}
            </ButtonLink>
          }
        >
          <p>{t.blockedBody}</p>
        </Alert>
      ) : selected.status !== 'active' ? (
        <Alert
          tone="warning"
          title={t.notActiveTitle}
          actions={
            <ButtonLink to={`/app/profili/${selected.id}`} variant="secondary" size="sm">
              {t.notActiveCta}
            </ButtonLink>
          }
        >
          <p>{t.notActiveBody}</p>
        </Alert>
      ) : (
        <BrokerPicker key={selected.id} profile={selected} />
      )}

      <DataMap profileId={selected.id} />
    </div>
  );
}
