import { useState } from 'react';
import { Send } from 'lucide-react';
import { useOutbox } from '@/api/queries';
import { it } from '@/i18n/it';
import { formatDateTime } from '@/lib/format';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { QueryBoundary } from '@/components/ui/QueryBoundary';
import { SkeletonList } from '@/components/ui/Skeleton';

const LIMIT = 25;

export function AdminOutboxPage() {
  const t = it.admin.outbox;
  const [page, setPage] = useState(1);
  const query = useOutbox({ page, limit: LIMIT });
  return (
    <QueryBoundary query={query} errorMessage={it.admin.loadError} skeleton={<SkeletonList rows={6} label={it.common.loading} />}>
      {(data) =>
        data.items.length === 0 ? (
          <EmptyState icon={Send} title={t.empty} />
        ) : (
          <div className="space-y-3">
            <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
              <table className="w-full min-w-[48rem] text-left text-sm">
                <caption className="sr-only">{t.title}</caption>
                <thead className="bg-sunken text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th scope="col" className="px-4 py-3">{t.at}</th>
                    <th scope="col" className="px-4 py-3">{t.to}</th>
                    <th scope="col" className="px-4 py-3">{t.subject}</th>
                    <th scope="col" className="px-4 py-3">{t.request}</th>
                    <th scope="col" className="px-4 py-3">{t.mode}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {data.items.map((item) => (
                    <tr key={item.id}>
                      <td className="whitespace-nowrap px-4 py-3">
                        <time dateTime={item.at}>{formatDateTime(item.at)}</time>
                      </td>
                      <td className="break-all px-4 py-3">{item.to.join(', ')}</td>
                      <td className="px-4 py-3">{item.subject}</td>
                      <td className="break-all px-4 py-3 font-mono text-xs">{item.requestId}</td>
                      <td className="px-4 py-3">
                        {item.dryRun ? <Badge tone="warning">{t.dryRun}</Badge> : <Badge tone="success" >{t.sent}</Badge>}
                        {item.providerId && <span className="sr-only"> {t.provider}: {item.providerId}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={data.page} limit={data.limit} total={data.total} onPageChange={setPage} />
          </div>
        )
      }
    </QueryBoundary>
  );
}
