import type { RequestGroup, RequestStatus } from '@/api/types';
import { it } from '@/i18n/it';
import { GROUP_TONE, STATUS_TONE } from '@/lib/requestStatus';
import { Badge } from '@/components/ui/Badge';

export function StatusBadge({ status }: { status: RequestStatus }) {
  return <Badge tone={STATUS_TONE[status]}>{it.status.request[status]}</Badge>;
}

export function GroupBadge({ group }: { group: RequestGroup }) {
  return <Badge tone={GROUP_TONE[group]}>{it.status.group[group]}</Badge>;
}
