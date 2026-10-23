import { useState } from 'react';
import { MailX } from 'lucide-react';
import { useUnmatchedInbound } from '@/api/queries';
import { useAssignInbound } from '@/api/mutations';
import type { UnmatchedInboundDto } from '@/api/types';
import { it } from '@/i18n/it';
import { formatDateTime } from '@/lib/format';
import { ApiErrorAlert } from '@/components/ApiErrorAlert';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { TextField } from '@/components/ui/Field';
import { QueryBoundary } from '@/components/ui/QueryBoundary';

function InboundCard({ message }: { message: UnmatchedInboundDto }) {
  const t = it.admin.inbound;
  const [requestId, setRequestId] = useState('');
  const assign = useAssignInbound();
  const assigned = message.assignedRequestId !== null;

  return (
    <Card className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-semibold">{message.subject}</p>
        {assigned && <Badge tone="success">{t.assigned}</Badge>}
        <time dateTime={message.receivedAt} className="ml-auto text-xs text-muted">
          {t.receivedAt} {formatDateTime(message.receivedAt)}
        </time>
      </div>
      <dl className="grid gap-x-3 text-xs text-muted sm:grid-cols-[auto_1fr]">
        <dt className="font-medium">{t.from}</dt>
        <dd className="break-all">{message.from}</dd>
        <dt className="font-medium">{t.to}</dt>
        <dd className="break-all">{message.to.join(', ')}</dd>
      </dl>
      <p className="max-h-48 overflow-auto whitespace-pre-wrap rounded-xl bg-sunken p-3 text-sm">{message.text}</p>
      {!assigned && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (requestId.trim()) assign.mutate({ id: message.id, requestId: requestId.trim() });
          }}
          className="flex flex-wrap items-end gap-3"
        >
          <div className="min-w-64 flex-1">
            <TextField label={t.requestId} hint={t.requestIdHint} value={requestId} onChange={(event) => setRequestId(event.target.value)} />
          </div>
          <Button type="submit" loading={assign.isPending} disabled={requestId.trim() === ''}>
            {t.assign}
          </Button>
        </form>
      )}
      <ApiErrorAlert error={assign.isError ? assign.error : null} />
    </Card>
  );
}

export function AdminInboundPage() {
  const t = it.admin.inbound;
  const query = useUnmatchedInbound();
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">{t.intro}</p>
      <QueryBoundary query={query} errorMessage={it.admin.loadError}>
        {(messages) =>
          messages.length === 0 ? (
            <EmptyState icon={MailX} title={t.empty} />
          ) : (
            <ul className="space-y-4">
              {messages.map((message) => (
                <li key={message.id}>
                  <InboundCard message={message} />
                </li>
              ))}
            </ul>
          )
        }
      </QueryBoundary>
    </div>
  );
}
