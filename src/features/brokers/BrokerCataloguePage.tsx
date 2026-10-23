import { useState } from 'react';
import { Search } from 'lucide-react';
import { useSearchParams } from 'react-router';
import { useBrokers } from '@/api/queries';
import type { BrokerDto } from '@/api/types';
import { it } from '@/i18n/it';
import { CATEGORY_OPTIONS, VERIFICATION_OPTIONS, parseCategory, parsePage, parseVerification } from '@/lib/enums';
import { useDebouncedCallback } from '@/lib/useDebouncedCallback';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { CheckboxField, SelectField, TextField } from '@/components/ui/Field';
import { Pagination } from '@/components/ui/Pagination';
import { QueryBoundary } from '@/components/ui/QueryBoundary';
import { SkeletonList } from '@/components/ui/Skeleton';
import { BrokerBadges } from './BrokerBadges';
import { BrokerDialog } from './BrokerDialog';

const LIMIT = 12;
const SEARCH_DELAY_MS = 300;

export function BrokerCataloguePage() {
  const t = it.brokers;
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get('q') ?? '');
  const [selected, setSelected] = useState<BrokerDto | null>(null);

  const q = params.get('q') ?? '';
  const category = parseCategory(params.get('category'));
  const status = parseVerification(params.get('status'));
  const sendable = params.get('sendable') === '1';
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

  const applySearch = useDebouncedCallback((value: string) => update({ q: value.trim() }), SEARCH_DELAY_MS);
  const hasFilters = q !== '' || category !== undefined || status !== undefined || sendable;

  const query = useBrokers({ q: q || undefined, category, status, sendable: sendable || undefined, page, limit: LIMIT });

  const reset = () => {
    setSearch('');
    setParams({}, { replace: true });
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-10 sm:px-6 sm:py-14">
      <header className="max-w-3xl space-y-2 border-b border-line pb-6">
        <h1 className="text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">{t.title}</h1>
        <p className="text-sm leading-relaxed text-muted sm:text-base">{t.intro}</p>
      </header>

      <Card className="bg-sunken/45">
        <form role="search" aria-label={it.common.filters} onSubmit={(event) => event.preventDefault()} className="grid gap-4 md:grid-cols-4">
          <div className="md:col-span-2">
            <TextField
              label={t.searchLabel}
              type="search"
              placeholder={t.searchPlaceholder}
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                applySearch(event.target.value);
              }}
            />
          </div>
          <SelectField label={t.categoryLabel} value={category ?? ''} onChange={(event) => update({ category: event.target.value })}>
            <option value="">{t.allCategories}</option>
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {it.categories[option]}
              </option>
            ))}
          </SelectField>
          <SelectField label={t.statusLabel} value={status ?? ''} onChange={(event) => update({ status: event.target.value })}>
            <option value="">{t.allStatuses}</option>
            {VERIFICATION_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {it.verification[option]}
              </option>
            ))}
          </SelectField>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line/70 pt-3 md:col-span-4">
            <CheckboxField
              label={t.sendableLabel}
              checked={sendable}
              onChange={(event) => update({ sendable: event.target.checked ? '1' : null })}
            />
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={reset}>
                {it.common.resetFilters}
              </Button>
            )}
          </div>
        </form>
      </Card>

      <QueryBoundary query={query} errorMessage={t.loadError} skeleton={<SkeletonList rows={6} label={it.common.loading} />}>
        {(data) =>
          data.items.length === 0 ? (
            <EmptyState
              icon={Search}
              title={t.emptyTitle}
              description={t.emptyBody}
              action={
                hasFilters ? (
                  <Button variant="secondary" onClick={reset}>
                    {it.common.resetFilters}
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <section aria-label={t.title} className="space-y-4">
              <p className="font-mono text-xs font-medium text-muted" aria-live="polite">
                {it.common.results(data.total)}
              </p>
              <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {data.items.map((broker) => (
                  <li key={broker.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(broker)}
                      aria-label={t.openDetails(broker.name)}
                      className="flex h-full w-full flex-col justify-between gap-3 rounded-xl border border-line bg-surface p-4 text-left shadow-2xs transition-all hover:border-primary/50 hover:shadow-sm"
                    >
                      <div className="space-y-1">
                        <span className="block text-sm font-semibold tracking-tight text-fg">{broker.name}</span>
                        <span className="block text-xs text-muted">{it.categories[broker.category]}</span>
                      </div>
                      <BrokerBadges broker={broker} />
                    </button>
                  </li>
                ))}
              </ul>
              <Pagination page={data.page} limit={data.limit} total={data.total} onPageChange={(next) => update({ page: String(next) })} />
            </section>
          )
        }
      </QueryBoundary>

      <BrokerDialog broker={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
