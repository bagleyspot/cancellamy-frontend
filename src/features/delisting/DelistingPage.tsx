import { useState } from 'react';
import { ChevronRight, Plus, SearchX } from 'lucide-react';
import { useSearchParams } from 'react-router';
import { useDelistings } from '@/api/queries';
import { it } from '@/i18n/it';
import { DELISTING_STATUS_OPTIONS, parseDelistingStatus, parsePage } from '@/lib/enums';
import { formatDate } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { SelectField } from '@/components/ui/Field';
import { PageHeader } from '@/components/ui/PageHeader';
import { Pagination } from '@/components/ui/Pagination';
import { QueryBoundary } from '@/components/ui/QueryBoundary';
import { SkeletonList } from '@/components/ui/Skeleton';
import { NoProfile } from '@/features/profiles/NoProfile';
import { useSelectedProfile } from '@/features/shell/ProfileContext';
import { DelistingDetail } from './DelistingDetail';
import { DelistingForm } from './DelistingForm';
import { DelistingStatusBadge } from './DelistingStatusBadge';

const t = it.delisting;
const LIMIT = 20;

export function DelistingPage() {
  const { selected, isLoading } = useSelectedProfile();
  const [params, setParams] = useSearchParams();
  const [creating, setCreating] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const status = parseDelistingStatus(params.get('status'));
  const page = parsePage(params.get('page'));

  const update = (changes: Record<string, string | null>) => {
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        for (const [key, value] of Object.entries(changes)) {
          if (value === null || value === '') next.delete(key);
          else next.set(key, value);
        }
        if (!('page' in changes)) next.delete('page');
        return next;
      },
      { replace: true },
    );
  };

  const profileId = selected?.id;
  const query = useDelistings({ profileId, status, page, limit: LIMIT }, profileId !== undefined);

  if (isLoading) return <SkeletonList label={it.common.loading} />;
  if (!selected) return <NoProfile description={t.noProfile} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.title}
        description={t.subtitle(`${selected.firstName} ${selected.lastName}`)}
        actions={
          !creating && (
            <Button onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t.newRequest}
            </Button>
          )
        }
      />
      <p className="max-w-3xl text-sm text-muted">{t.intro}</p>

      {creating && (
        <DelistingForm
          key={selected.id}
          profile={selected}
          onCancel={() => setCreating(false)}
          onCreated={(created) => {
            setCreating(false);
            setOpenId(created.id);
          }}
        />
      )}

      <div className="max-w-xs">
        <SelectField label={t.filterLabel} value={status ?? ''} onChange={(event) => update({ status: event.target.value })}>
          <option value="">{t.allStatuses}</option>
          {DELISTING_STATUS_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {t.status[option]}
            </option>
          ))}
        </SelectField>
      </div>

      <QueryBoundary query={query} errorMessage={t.loadError} skeleton={<SkeletonList rows={4} label={it.common.loading} />}>
        {(data) =>
          data.items.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title={status ? t.emptyFiltered : t.emptyTitle}
              description={status ? undefined : t.emptyBody}
              action={
                !status && !creating ? (
                  <Button onClick={() => setCreating(true)}>
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    {t.newRequest}
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <>
              <p className="text-sm text-muted" aria-live="polite">
                {it.common.results(data.total)}
              </p>
              <ul className="space-y-3">
                {data.items.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => setOpenId(item.id)}
                      aria-label={t.list.open(item.url)}
                      className="flex w-full items-center gap-3 rounded-2xl border border-line bg-surface p-4 text-left transition-colors hover:border-primary"
                    >
                      <span className="min-w-0 flex-1 space-y-1.5">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold">{t.engine[item.engine]}</span>
                          <DelistingStatusBadge status={item.status} />
                        </span>
                        <span className="block break-all text-sm">{item.url}</span>
                        <span className="block text-sm text-muted">
                          {item.submittedAt ? t.list.submittedOn(formatDate(item.submittedAt)) : t.list.createdOn(formatDate(item.createdAt))}
                          {item.followUpAt && item.status === 'submitted' ? ` · ${t.list.followUp(formatDate(item.followUpAt))}` : ''}
                        </span>
                      </span>
                      <ChevronRight className="h-5 w-5 shrink-0 text-muted" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
              <Pagination page={data.page} limit={data.limit} total={data.total} onPageChange={(next) => update({ page: String(next) })} />
            </>
          )
        }
      </QueryBoundary>

      <DelistingDetail id={openId} onClose={() => setOpenId(null)} />
    </div>
  );
}
