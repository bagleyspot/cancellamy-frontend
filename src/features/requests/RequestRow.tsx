import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router';
import type { RequestListItem } from '@/api/types';
import { it } from '@/i18n/it';
import { Badge } from '@/components/ui/Badge';
import { describeDue } from './dueInfo';
import { StatusBadge } from './StatusBadge';

export function RequestRow({ item }: { item: RequestListItem }) {
  const t = it.requests;
  const due = describeDue(item);
  return (
    <li>
      <Link
        to={`/app/richieste/${item.id}`}
        aria-label={t.open(item.broker.name)}
        className="flex items-center gap-3 rounded-xl border border-line bg-surface p-4 shadow-2xs transition-all hover:border-primary/50 hover:shadow-sm"
      >
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold tracking-tight text-fg">{item.broker.name}</span>
            <StatusBadge status={item.status} />
            {item.kind === 'access' && <Badge tone="accent">{it.findings.kindBadge}</Badge>}
            {item.custom && <Badge tone="neutral">{t.custom}</Badge>}
            {item.dryRun && <Badge tone="warning">{t.dryRun}</Badge>}
            {item.cycle > 1 && <Badge tone="neutral">{t.cycle(item.cycle)}</Badge>}
          </div>
          <p className="text-xs text-muted">
            {it.categories[item.broker.category]} · {item.channel === 'email' ? t.channelEmail : t.channelManual} ·{' '}
            <span className="font-mono">{item.shortRef}</span>
          </p>
          {item.actionReason && item.status === 'action_required' && (
            <p className="text-xs font-semibold text-warning">{it.status.actionReason[item.actionReason]}</p>
          )}
          {due && <p className="text-xs text-muted">{due}</p>}
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
      </Link>
    </li>
  );
}
