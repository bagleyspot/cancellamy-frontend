import { useState } from 'react';
import { BellOff, CheckCheck } from 'lucide-react';
import { Link } from 'react-router';
import { useNotifications } from '@/api/queries';
import { useMarkNotificationsRead } from '@/api/mutations';
import { it } from '@/i18n/it';
import { cn } from '@/lib/cn';
import { formatDateTime } from '@/lib/format';
import { ApiErrorAlert } from '@/components/ApiErrorAlert';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { CheckboxField } from '@/components/ui/Field';
import { PageHeader } from '@/components/ui/PageHeader';
import { Pagination } from '@/components/ui/Pagination';
import { QueryBoundary } from '@/components/ui/QueryBoundary';
import { SkeletonList } from '@/components/ui/Skeleton';

const LIMIT = 20;

export function NotificationsPage() {
  const t = it.notifications;
  const [page, setPage] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const query = useNotifications({ page, limit: LIMIT, ...(unreadOnly && { unread: true }) });
  const markRead = useMarkNotificationsRead();

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.title}
        description={t.subtitle}
        actions={
          <Button variant="secondary" onClick={() => markRead.mutate(undefined)} loading={markRead.isPending}>
            <CheckCheck className="h-4 w-4" aria-hidden="true" />
            {t.markAll}
          </Button>
        }
      />
      <CheckboxField
        label={t.unreadOnly}
        checked={unreadOnly}
        onChange={(event) => {
          setUnreadOnly(event.target.checked);
          setPage(1);
        }}
      />
      <ApiErrorAlert error={markRead.isError ? markRead.error : null} />
      <QueryBoundary query={query} errorMessage={t.loadError} skeleton={<SkeletonList rows={5} label={it.common.loading} />}>
        {(data) =>
          data.items.length === 0 ? (
            <EmptyState icon={BellOff} title={t.emptyTitle} description={t.emptyBody} />
          ) : (
            <>
              <ul className="space-y-3">
                {data.items.map((notification) => {
                  const unread = notification.readAt === null;
                  return (
                    <li
                      key={notification.id}
                      className={cn('space-y-2 rounded-2xl border p-4', unread ? 'border-primary/40 bg-primary-soft' : 'border-line bg-surface')}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={notification.type === 'action_required' ? 'accent' : 'neutral'}>{t.types[notification.type]}</Badge>
                        {unread && <Badge tone="info">{t.unread}</Badge>}
                        <time dateTime={notification.createdAt} className="ml-auto text-xs text-muted">
                          {formatDateTime(notification.createdAt)}
                        </time>
                      </div>
                      <p className="font-semibold">{notification.title}</p>
                      <p className="text-sm text-muted">{notification.body}</p>
                      <div className="flex flex-wrap items-center gap-3 text-sm">
                        {notification.requestId && (
                          <Link
                            to={`/app/richieste/${notification.requestId}`}
                            onClick={() => unread && markRead.mutate([notification.id])}
                            className="font-medium text-primary underline underline-offset-2"
                          >
                            {t.openRequest}
                          </Link>
                        )}
                        {unread && (
                          <Button variant="ghost" size="sm" onClick={() => markRead.mutate([notification.id])} disabled={markRead.isPending}>
                            {t.markOne}
                          </Button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
              <Pagination page={data.page} limit={data.limit} total={data.total} onPageChange={setPage} />
            </>
          )
        }
      </QueryBoundary>
    </div>
  );
}
