import { ArrowLeft } from 'lucide-react';
import { Link, useParams } from 'react-router';
import { useConfig, useRequest } from '@/api/queries';
import type { RequestDetail } from '@/api/types';
import { it } from '@/i18n/it';
import { formatDate } from '@/lib/format';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Card, CardTitle } from '@/components/ui/Card';
import { QueryBoundary } from '@/components/ui/QueryBoundary';
import { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton';
import { BrokerInfo } from '@/features/brokers/BrokerDialog';
import { AccessFindingsCard } from './AccessFindingsCard';
import { ActionsPanel } from './ActionsPanel';
import { DossierCard } from './DossierCard';
import { describeDue } from './dueInfo';
import { MessageThread } from './MessageThread';
import { StatusBadge } from './StatusBadge';
import { Timeline } from './Timeline';

function DetailSkeleton() {
  return (
    <SkeletonGroup label={it.common.loading} className="space-y-4">
      <Skeleton className="h-10 w-2/3" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-64 w-full" />
    </SkeletonGroup>
  );
}

function DetailContent({ detail }: { detail: RequestDetail }) {
  const t = it.requests;
  const due = describeDue(detail);
  const { data: config } = useConfig();
  const hasIncomingAttachments = detail.messages.some((message) => message.direction === 'in' && message.attachments.length > 0);
  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{detail.broker.name}</h1>
          <StatusBadge status={detail.status} />
          {detail.kind === 'access' && <Badge tone="accent">{it.findings.kindBadge}</Badge>}
          {detail.custom && <Badge>{t.custom}</Badge>}
          {detail.dryRun && <Badge tone="warning">{t.dryRun}</Badge>}
          {detail.cycle > 1 && <Badge>{t.cycle(detail.cycle)}</Badge>}
        </div>
        <p className="text-sm text-muted">
          {t.detail.reference}: <span className="font-mono">{detail.shortRef}</span> · {t.createdOn(formatDate(detail.createdAt))}
          {detail.sentAt ? ` · ${t.sentOn(formatDate(detail.sentAt))}` : ''}
        </p>
        {due && <p className="text-sm font-medium">{due}</p>}
        {detail.nextCheckAt && <p className="text-sm text-muted">{t.nextCheck(formatDate(detail.nextCheckAt))}</p>}
        {detail.status === 'draft' && (
          <Alert tone="info" title={t.detail.draftTitle}>
            <p>{t.detail.draftBody}</p>
          </Alert>
        )}
        {detail.status === 'queued' && (
          <Alert tone="info" title="Richiesta in coda di invio">
            <p>
              {detail.nextAttemptAt
                ? `L'invio di questa richiesta è programmato per il ${formatDate(detail.nextAttemptAt)}.`
                : 'L’invio di questa richiesta è programmato a breve.'}
            </p>
            <p className="mt-1 text-xs text-muted">
              Le richieste automatiche sono scaglionate a un massimo di 5 al giorno per utente per rispettare le quote operative del servizio, prevenire filtri antispam e garantire un accesso equo per tutti gli utenti.
            </p>
          </Alert>
        )}
        {detail.status === 'action_required' && detail.actionReason && (
          <Alert tone="warning" title={t.detail.reason}>
            <p>{it.status.actionReason[detail.actionReason]}</p>
          </Alert>
        )}
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <ActionsPanel detail={detail} />
          {detail.kind === 'access' && <AccessFindingsCard detail={detail} />}
          <Card className="space-y-4">
            <CardTitle>{t.detail.messages}</CardTitle>
            <MessageThread requestId={detail.id} messages={detail.messages} />
            {hasIncomingAttachments && config && <p className="text-xs text-muted">{it.attachments.retention(config.attachmentRetentionDays)}</p>}
          </Card>
        </div>
        <div className="space-y-6">
          <Card className="space-y-4">
            <CardTitle>{t.detail.timeline}</CardTitle>
            <Timeline events={detail.timeline} />
          </Card>
          <DossierCard detail={detail} />
          <Card className="space-y-4">
            <CardTitle>{t.detail.brokerSection}</CardTitle>
            <BrokerInfo broker={detail.broker} />
          </Card>
        </div>
      </div>
    </div>
  );
}

export function RequestDetailPage() {
  const { id = '' } = useParams();
  const query = useRequest(id);
  return (
    <div className="space-y-6">
      <Link to="/app/richieste" className="inline-flex items-center gap-1 text-sm font-medium text-primary underline underline-offset-2">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {it.requests.detail.back}
      </Link>
      <QueryBoundary query={query} skeleton={<DetailSkeleton />} errorMessage={it.requests.detail.loadError}>
        {(detail) => <DetailContent detail={detail} />}
      </QueryBoundary>
    </div>
  );
}
