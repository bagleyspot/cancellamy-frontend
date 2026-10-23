import { ExternalLink as ExternalLinkIcon } from 'lucide-react';
import type { BrokerDto } from '@/api/types';
import { it } from '@/i18n/it';
import { formatDate } from '@/lib/format';
import { Badge } from '@/components/ui/Badge';
import { ExternalLink } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { BrokerBadges } from './BrokerBadges';

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}

/** Broker data block, reused by the public dialog and by the request detail page. */
export function BrokerInfo({ broker }: { broker: BrokerDto }) {
  const t = it.brokers.detail;
  return (
    <div className="space-y-4">
      <BrokerBadges broker={broker} />
      <dl className="grid gap-4 sm:grid-cols-2">
        <Row label={it.common.category}>{it.categories[broker.category]}</Row>
        <Row label={t.website}>
          {broker.website ? (
            <ExternalLink href={broker.website}>
              {broker.website}
              <ExternalLinkIcon className="ml-1 inline h-3.5 w-3.5" aria-hidden="true" />
              <span className="sr-only"> {it.common.externalLink}</span>
            </ExternalLink>
          ) : (
            it.common.notAvailable
          )}
        </Row>
        <Row label={t.hqCountry}>{broker.hqCountry ?? it.common.notAvailable}</Row>
        <Row label={t.lastVerified}>{formatDate(broker.lastVerified)}</Row>
        <Row label={t.idRequested}>
          {broker.idRequested ? (it.brokers.idRequested[broker.idRequested] ?? broker.idRequested) : it.common.notAvailable}
        </Row>
      </dl>

      <section aria-label={t.channels} className="space-y-2">
        <h3 className="text-sm font-semibold">{t.channels}</h3>
        {broker.channels.length === 0 ? (
          <p className="text-sm text-muted">{t.noChannels}</p>
        ) : (
          <ul className="space-y-2">
            {broker.channels.map((channel) => (
              <li key={`${channel.type}:${channel.value}`} className="flex flex-wrap items-center gap-2 rounded-xl border border-line px-3 py-2 text-sm">
                <Badge tone="neutral">{it.channels[channel.type]}</Badge>
                <span className="min-w-0 break-all font-medium">{channel.value}</span>
                {channel.label && <span className="text-muted">({channel.label})</span>}
                <span className="ml-auto text-xs text-muted">
                  {channel.verified ? t.channelVerified : t.channelUnverified}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-1">
        <h3 className="text-sm font-semibold">{t.legalNote}</h3>
        <p className="whitespace-pre-line text-sm text-muted">{broker.legalBasisNote ?? t.noInfo}</p>
      </section>
      <section className="space-y-1">
        <h3 className="text-sm font-semibold">{t.obstacles}</h3>
        <p className="whitespace-pre-line text-sm text-muted">{broker.obstacles ?? t.noInfo}</p>
      </section>
    </div>
  );
}

export function BrokerDialog({ broker, onClose }: { broker: BrokerDto | null; onClose: () => void }) {
  return (
    <Dialog open={broker !== null} onClose={onClose} title={broker?.name ?? ''} size="lg">
      {broker && <BrokerInfo broker={broker} />}
    </Dialog>
  );
}
