import { useMutation } from '@tanstack/react-query';
import { ArrowDownLeft, ArrowUpRight, Download, Paperclip } from 'lucide-react';
import { api } from '@/api/endpoints';
import { isApiError } from '@/api/http';
import type { MessageAttachmentDto, MessageDto } from '@/api/types';
import { it } from '@/i18n/it';
import { cn } from '@/lib/cn';
import { describeError } from '@/lib/errors';
import { downloadBlob } from '@/lib/files';
import { formatDate, formatDateTime, formatFileSize } from '@/lib/format';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface AttachmentProps {
  requestId: string;
  messageId: string;
  attachment: MessageAttachmentDto;
  incoming: boolean;
}

function Attachment({ requestId, messageId, attachment, incoming }: AttachmentProps) {
  const t = it.attachments;
  const download = useMutation({
    mutationFn: async () => downloadBlob(await api.requests.attachment(requestId, messageId, attachment.id), attachment.filename),
  });
  const size = attachment.size !== undefined ? ` (${formatFileSize(attachment.size)})` : '';
  const gone = download.isError && isApiError(download.error) && (download.error.status === 404 || download.error.status === 410);

  if (incoming && attachment.downloadable) {
    return (
      <li className="space-y-1">
        <Button variant="secondary" size="sm" onClick={() => download.mutate()} loading={download.isPending} aria-label={`${t.download(attachment.filename)}${size}`}>
          <Download className="h-4 w-4" aria-hidden="true" />
          {attachment.filename}
          {size && <span className="font-normal text-muted">{size}</span>}
        </Button>
        {attachment.expiresAt && <p className="text-xs text-muted">{t.expires(formatDate(attachment.expiresAt))}</p>}
        {download.isError && (
          <p role="alert" className="text-xs font-medium text-danger">
            {gone ? t.error : describeError(download.error)[0]}
          </p>
        )}
      </li>
    );
  }

  return (
    <li className="space-y-1">
      <span className="inline-flex items-center gap-1 rounded-lg bg-sunken px-2 py-1 text-xs">
        <Paperclip className="h-3.5 w-3.5" aria-hidden="true" />
        {attachment.filename}
        {size && <span className="text-muted">{size}</span>}
      </span>
      {incoming && <p className="text-xs text-muted">{t.unavailable}</p>}
    </li>
  );
}

function Message({ requestId, message }: { requestId: string; message: MessageDto }) {
  const t = it.requests.detail;
  const outgoing = message.direction === 'out';
  const Icon = outgoing ? ArrowUpRight : ArrowDownLeft;
  return (
    <li className={cn('space-y-2 rounded-2xl border p-4', outgoing ? 'border-line bg-surface' : 'border-primary/30 bg-primary-soft')}>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
        <span className="font-semibold">{outgoing ? t.out : t.in}</span>
        <Badge tone={message.via === 'smtp' ? 'accent' : 'neutral'}>{it.via[message.via]}</Badge>
        {message.dryRun && <Badge tone="warning">{t.dryRunMessage}</Badge>}
        {message.classification && <Badge tone="info">{it.status.replyLabel[message.classification]}</Badge>}
        <time dateTime={message.at} className="ml-auto text-xs text-muted">
          {formatDateTime(message.at)}
        </time>
      </div>
      <dl className="grid gap-x-3 text-xs text-muted sm:grid-cols-[auto_1fr]">
        <dt className="font-medium">{t.from}</dt>
        <dd className="break-all">{message.from}</dd>
        <dt className="font-medium">{t.to}</dt>
        <dd className="break-all">{message.to.join(', ')}</dd>
        <dt className="font-medium">{t.subject}</dt>
        <dd>{message.subject}</dd>
      </dl>
      <p className="whitespace-pre-wrap text-sm">{message.text}</p>
      {message.attachments.length > 0 && (
        <ul aria-label={t.attachments} className="flex flex-wrap gap-3">
          {message.attachments.map((attachment) => (
            <Attachment key={attachment.id} requestId={requestId} messageId={message.id} attachment={attachment} incoming={!outgoing} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function MessageThread({ requestId, messages }: { requestId: string; messages: MessageDto[] }) {
  if (messages.length === 0) return <p className="text-sm text-muted">{it.requests.detail.noMessages}</p>;
  return (
    <ul className="space-y-3">
      {messages.map((message) => (
        <Message key={message.id} requestId={requestId} message={message} />
      ))}
    </ul>
  );
}
