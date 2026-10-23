import type { ProfileStatus } from '@/api/types';
import { it } from '@/i18n/it';
import type { Tone } from '@/lib/requestStatus';
import { Badge } from '@/components/ui/Badge';

const TONE: Record<ProfileStatus, Tone> = { draft: 'neutral', ready: 'info', active: 'success', paused: 'warning' };

export function ProfileStatusBadge({ status }: { status: ProfileStatus }) {
  return <Badge tone={TONE[status]}>{it.status.profile[status]}</Badge>;
}
