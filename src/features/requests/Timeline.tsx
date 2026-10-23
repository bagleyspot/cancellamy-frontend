import type { TimelineEvent } from '@/api/types';
import { it } from '@/i18n/it';
import { formatDateTime } from '@/lib/format';
import { StatusBadge } from './StatusBadge';

export function Timeline({ events }: { events: TimelineEvent[] }) {
  return (
    <ol className="relative space-y-4 border-l-2 border-line pl-5">
      {events.map((event, index) => (
        <li key={`${event.at}-${index}`} className="relative">
          <span aria-hidden="true" className="absolute -left-[1.6rem] top-1.5 h-3 w-3 rounded-full border-2 border-surface bg-primary" />
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium">{it.status.timeline[event.type]}</p>
            {event.status && <StatusBadge status={event.status} />}
          </div>
          <p className="text-xs text-muted">
            <time dateTime={event.at}>{formatDateTime(event.at)}</time>
          </p>
          {event.note && <p className="mt-1 whitespace-pre-line text-sm text-muted">{event.note}</p>}
        </li>
      ))}
    </ol>
  );
}
