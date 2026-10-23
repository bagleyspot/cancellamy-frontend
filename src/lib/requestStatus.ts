import type { RequestGroup, RequestStatus } from '@/api/types';

export type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'accent';

/** Mirrors the contract: UI grouping of request statuses (same four tabs as the dashboard). */
export const GROUP_OF_STATUS: Record<RequestStatus, RequestGroup> = {
  queued: 'in_progress',
  sent: 'in_progress',
  replied: 'in_progress',
  overdue: 'in_progress',
  escalated: 'in_progress',
  action_required: 'action_required',
  completed: 'completed',
  refused: 'not_removable',
  cancelled: 'not_removable',
};

export const STATUS_TONE: Record<RequestStatus, Tone> = {
  queued: 'neutral',
  sent: 'info',
  replied: 'info',
  overdue: 'warning',
  escalated: 'danger',
  action_required: 'accent',
  completed: 'success',
  refused: 'danger',
  cancelled: 'neutral',
};

export const GROUP_TONE: Record<RequestGroup, Tone> = {
  in_progress: 'info',
  action_required: 'accent',
  completed: 'success',
  not_removable: 'neutral',
};

export const REQUEST_GROUPS: RequestGroup[] = ['in_progress', 'action_required', 'completed', 'not_removable'];

export function groupOfStatus(status: RequestStatus): RequestGroup {
  return GROUP_OF_STATUS[status];
}

const CANCELLABLE: ReadonlySet<RequestStatus> = new Set([
  'queued',
  'sent',
  'replied',
  'action_required',
  'overdue',
  'escalated',
]);

export function isCancellable(status: RequestStatus): boolean {
  return CANCELLABLE.has(status);
}
