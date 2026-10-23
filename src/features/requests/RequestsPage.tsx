import { useState } from 'react';
import { Plus, SearchX } from 'lucide-react';
import { useSearchParams } from 'react-router';
import { useRequests, useSummary } from '@/api/queries';
import type { RequestGroup } from '@/api/types';
import { it } from '@/i18n/it';
import { CATEGORY_OPTIONS, parseCategory, parseGroup, parsePage } from '@/lib/enums';
import { REQUEST_GROUPS } from '@/lib/requestStatus';
import { useDebouncedCallback } from '@/lib/useDebouncedCallback';
import { Badge } from '@/components/ui/Badge';
import { ButtonLink } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { SelectField, TextField } from '@/components/ui/Field';
import { PageHeader } from '@/components/ui/PageHeader';
import { Pagination } from '@/components/ui/Pagination';
import { QueryBoundary } from '@/components/ui/QueryBoundary';
import { SkeletonList } from '@/components/ui/Skeleton';
import { Tabs, panelId, tabId } from '@/components/ui/Tabs';
import { useSelectedProfile } from '@/features/shell/ProfileContext';
import { NoProfile } from '@/features/profiles/NoProfile';
import { RequestRow } from './RequestRow';

const LIMIT = 20;
const ID_PREFIX = 'requests';

function countOf(group: RequestGroup, counts: { inProgress: number; actionRequired: number; completed: number; notRemovable: number }) {
  switch (group) {
    case 'in_progress':
      return counts.inProgress;
    case 'action_required':
      return counts.actionRequired;
    case 'completed':
      return counts.completed;
    case 'not_removable':
      return counts.notRemovable;
  }
}

export function RequestsPage() {
  const t = it.requests;
  const { selected, isLoading } = useSelectedProfile();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get('q') ?? '');

  const group = parseGroup(params.get('group'), 'in_progress');
  const category = parseCategory(params.get('category'));
  const q = params.get('q') ?? '';
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
  const applySearch = useDebouncedCallback((value: string) => update({ q: value.trim() }), 300);

  const profileId = selected?.id;
  const summary = useSummary(profileId, profileId !== undefined);
  const query = useRequests({ profileId, group, category, q: q || undefined, page, limit: LIMIT }, profileId !== undefined);

  if (isLoading) return <SkeletonList label={it.common.loading} />;
  if (!selected) return <NoProfile description={t.noProfileBody} />;

  const counts = summary.data?.counts;
  const tabs = REQUEST_GROUPS.map((id) => ({
    id,
    label: it.status.group[id],
    badge: counts ? <Badge tone={id === group ? 'info' : 'neutral'}>{countOf(id, counts)}</Badge> : undefined,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.title}
        description={t.subtitle(`${selected.firstName} ${selected.lastName}`)}
        actions={
          <ButtonLink to="/app/richieste/nuova" variant="secondary">
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t.newRequest}
          </ButtonLink>
        }
      />

      <Tabs tabs={tabs} value={group} onChange={(id) => update({ group: id })} ariaLabel={t.tabsLabel} idPrefix={ID_PREFIX} />

      <div role="tabpanel" id={panelId(ID_PREFIX, group)} aria-labelledby={tabId(ID_PREFIX, group)} className="space-y-4">
        <p className="text-sm text-muted">{it.status.groupHint[group]}</p>
        {group === 'in_progress' && (
          <div className="rounded-xl border border-line bg-sunken/60 p-3 text-xs text-muted flex items-center gap-2">
            <span className="font-semibold text-fg">Scaglioni giornalieri:</span>
            <span>Le richieste email automatiche vengono inviate a gruppi di massimo 5 al giorno per garantire un invio affidabile e rispettare le quote di trasmissione.</span>
          </div>
        )}
        <form role="search" onSubmit={(event) => event.preventDefault()} className="grid gap-4 sm:grid-cols-2">
          <TextField
            label={t.searchLabel}
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              applySearch(event.target.value);
            }}
          />
          <SelectField label={t.categoryLabel} value={category ?? ''} onChange={(event) => update({ category: event.target.value })}>
            <option value="">{t.allCategories}</option>
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {it.categories[option]}
              </option>
            ))}
          </SelectField>
        </form>

        <QueryBoundary query={query} errorMessage={t.loadError} skeleton={<SkeletonList rows={5} label={it.common.loading} />}>
          {(data) =>
            data.items.length === 0 ? (
              <EmptyState
                icon={SearchX}
                title={q || category ? t.emptyFiltered : t.emptyTitle}
                description={q || category ? undefined : t.emptyBody}
              />
            ) : (
              <>
                <p className="text-sm text-muted" aria-live="polite">
                  {it.common.results(data.total)}
                </p>
                <ul className="space-y-3">
                  {data.items.map((item) => (
                    <RequestRow key={item.id} item={item} />
                  ))}
                </ul>
                <Pagination page={data.page} limit={data.limit} total={data.total} onPageChange={(next) => update({ page: String(next) })} />
              </>
            )
          }
        </QueryBoundary>
      </div>
    </div>
  );
}
