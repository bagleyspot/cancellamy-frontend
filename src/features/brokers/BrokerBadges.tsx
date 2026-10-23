import { BadgeCheck, Send } from 'lucide-react';
import type { BrokerDto } from '@/api/types';
import { it } from '@/i18n/it';
import { Badge } from '@/components/ui/Badge';

export function BrokerBadges({ broker }: { broker: BrokerDto }) {
  const t = it.brokers;
  return (
    <div className="flex flex-wrap gap-1.5">
      {broker.verificationStatus === 'verified' ? (
        <Badge tone="success">
          <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
          {t.verifiedBadge}
        </Badge>
      ) : (
        <Badge tone="neutral">{it.verification[broker.verificationStatus]}</Badge>
      )}
      {broker.sendEnabled ? (
        <Badge tone="info">
          <Send className="h-3.5 w-3.5" aria-hidden="true" />
          {t.contactedBadge}
        </Badge>
      ) : (
        <Badge tone="neutral">{t.notContactedBadge}</Badge>
      )}
    </div>
  );
}
