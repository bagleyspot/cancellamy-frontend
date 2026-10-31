import { useState } from 'react';
import { Plus, Send, SearchX } from 'lucide-react';
import { useSearchParams } from 'react-router';
import { useSendRequests } from '@/api/mutations';
import { useConfig, useRequests, useSummary } from '@/api/queries';
import type { RequestGroup, RequestListItem, SendRequestsResponse } from '@/api/types';
import { it } from '@/i18n/it';
import { CATEGORY_OPTIONS, parseCategory, parseGroup, parsePage } from '@/lib/enums';
import { REQUEST_GROUPS } from '@/lib/requestStatus';
import { useDebouncedCallback } from '@/lib/useDebouncedCallback';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Button, ButtonLink } from '@/components/ui/Button';
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

function countOf(group: RequestGroup, counts: { toSend: number; inProgress: number; actionRequired: number; completed: number; notRemovable: number }) {
  switch (group) {
    case 'to_send':
      return counts.toSend;
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
  const config = useConfig().data;
  const max = config?.sendSelectionMax ?? 10;
  const selecting = group === 'to_send' && config?.sendSelection === 'manual';
  const sendMutation = useSendRequests();
  const [chosen, setChosen] = useState<{ id: string; name: string }[]>([]);
  const [result, setResult] = useState<{ response: SendRequestsResponse; names: Map<string, string> } | null>(null);
  const category = parseCategory(params.get('category'));
  const q = params.get('q') ?? '';
  const page = parsePage(params.get('page'));

  const update = (changes: Record<string, string | null>) => {
    if ('group' in changes) {
      setChosen([]);
      setResult(null);
    }
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

  const isChosen = (id: string) => chosen.some((entry) => entry.id === id);
  const toggle = (item: RequestListItem) =>
    setChosen((previous) =>
      previous.some((entry) => entry.id === item.id)
        ? previous.filter((entry) => entry.id !== item.id)
        : previous.length >= max
          ? previous
          : [...previous, { id: item.id, name: item.broker.name }],
    );
  const selectFirst = (items: RequestListItem[]) =>
    setChosen((previous) => {
      const next = [...previous];
      for (const item of items) {
        if (next.length >= max) break;
        if (!next.some((entry) => entry.id === item.id)) next.push({ id: item.id, name: item.broker.name });
      }
      return next;
    });
  const sendChosen = () => {
    const names = new Map(chosen.map((entry) => [entry.id, entry.name]));
    sendMutation.mutate(
      chosen.map((entry) => entry.id),
      {
        onSuccess: (response) => {
          setResult({ response, names });
          setChosen([]);
        },
      },
    );
  };

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
        {group === 'in_progress' && config?.sendSelection !== 'manual' && (
          <div className="rounded-xl border border-line bg-sunken/60 p-3 text-xs text-muted flex items-center gap-2">
            <span className="font-semibold text-fg">Scaglioni giornalieri:</span>
            <span>Le richieste email automatiche vengono inviate a gruppi di massimo 5 al giorno per garantire un invio affidabile e rispettare le quote di trasmissione.</span>
          </div>
        )}
        {selecting && <p className="text-sm text-muted">{t.selection.hint(max)}</p>}
        {result && (
          <div className="space-y-2">
            <Alert tone="success">{t.selection.done(result.response.queued)}</Alert>
            {result.response.skipped.length > 0 && (
              <Alert tone="warning" title={t.selection.skippedTitle}>
                <ul className="list-disc space-y-1 pl-5">
                  {result.response.skipped.map((entry) => (
                    <li key={entry.id}>{`${result.names.get(entry.id) ?? entry.id}: ${t.selection.skipped[entry.reason]}`}</li>
                  ))}
                </ul>
              </Alert>
            )}
          </div>
        )}
        {sendMutation.isError && <Alert tone="danger">{t.selection.sendError}</Alert>}
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
                {selecting && (
                  <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-sunken/60 p-3">
                    <p className="text-sm font-medium" aria-live="polite" role="status">
                      {t.selection.counter(chosen.length, max)}
                      {chosen.length >= max && <span className="ml-2 text-xs font-normal text-muted">{t.selection.maxReached(max)}</span>}
                    </p>
                    <div className="ml-auto flex flex-wrap gap-2">
                      <Button variant="secondary" size="sm" onClick={() => selectFirst(data.items)} disabled={chosen.length >= max}>
                        {t.selection.selectFirst(max)}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setChosen([])} disabled={chosen.length === 0}>
                        {t.selection.clear}
                      </Button>
                      <Button size="sm" onClick={sendChosen} disabled={chosen.length === 0} loading={sendMutation.isPending}>
                        <Send className="h-4 w-4" aria-hidden="true" />
                        {sendMutation.isPending ? t.selection.sending : t.selection.send}
                      </Button>
                    </div>
                  </div>
                )}
                <ul className="space-y-3">
                  {data.items.map((item) => (
                    <RequestRow
                      key={item.id}
                      item={item}
                      selection={
                        selecting
                          ? { checked: isChosen(item.id), disabled: !isChosen(item.id) && chosen.length >= max, onToggle: () => toggle(item) }
                          : undefined
                      }
                    />
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
