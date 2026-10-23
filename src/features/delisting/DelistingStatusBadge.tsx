import type { DelistingStatus } from '@/api/types';
import { it } from '@/i18n/it';
import type { Tone } from '@/lib/requestStatus';
import { Badge } from '@/components/ui/Badge';

const TONE: Record<DelistingStatus, Tone> = {
  to_submit: 'neutral',
  submitted: 'info',
  approved: 'success',
  partially_approved: 'warning',
  denied: 'danger',
  appealed: 'accent',
  cancelled: 'neutral',
};

export function DelistingStatusBadge({ status }: { status: DelistingStatus }) {
  return <Badge tone={TONE[status]}>{it.delisting.status[status]}</Badge>;
}
