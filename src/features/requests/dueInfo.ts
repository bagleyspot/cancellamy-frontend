import type { RequestListItem } from '@/api/types';
import { it } from '@/i18n/it';
import { daysFromNow, formatDate, formatRelativeDays } from '@/lib/format';

/** Human readable deadline line for a request, or null when there is no deadline to show. */
export function describeDue(
  item: Pick<RequestListItem, 'dueAt' | 'status' | 'completedAt'> & Partial<Pick<RequestListItem, 'nextAttemptAt'>>,
  now: Date = new Date(),
): string | null {
  const t = it.requests;
  if (item.status === 'completed' && item.completedAt) return t.completedOn(formatDate(item.completedAt));
  if (item.status === 'queued') {
    if (!item.nextAttemptAt) return 'In coda di invio';
    const attemptDate = new Date(item.nextAttemptAt);
    const isToday = attemptDate.toISOString().slice(0, 10) <= now.toISOString().slice(0, 10);
    return isToday ? 'Invio programmato: oggi' : `Invio programmato: ${formatDate(item.nextAttemptAt)}`;
  }
  if (!item.dueAt) return null;
  if (item.status === 'refused' || item.status === 'cancelled') return null;
  const days = daysFromNow(item.dueAt, now);
  const relative = formatRelativeDays(item.dueAt, now);
  return days !== null && days < 0 ? t.overdueSince(formatDate(item.dueAt), relative) : t.dueOn(formatDate(item.dueAt), relative);
}
