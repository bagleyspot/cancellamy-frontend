import { Lock, Trophy } from 'lucide-react';
import { useSearchParams } from 'react-router';
import { useBrokerLeaderboard } from '@/api/queries';
import type { BrokerPerformanceDto, LeaderboardDto, LeaderboardSort } from '@/api/types';
import { it } from '@/i18n/it';
import { CATEGORY_OPTIONS, LEADERBOARD_SORT_OPTIONS, parseCategory, parseLeaderboardSort } from '@/lib/enums';
import { formatDateTime, formatDecimal, formatNumber, formatPercent } from '@/lib/format';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { SelectField } from '@/components/ui/Field';
import { QueryBoundary } from '@/components/ui/QueryBoundary';
import { SkeletonList } from '@/components/ui/Skeleton';

const t = it.leaderboard;

function days(value: number | null): string {
  return value === null ? it.common.notAvailable : t.days(formatDecimal(value));
}

interface Column {
  key: string;
  label: string;
  sort?: LeaderboardSort;
  numeric?: boolean;
  render: (item: BrokerPerformanceDto) => string;
}

const COLUMNS: Column[] = [
  { key: 'users', label: t.columns.users, sort: 'users', numeric: true, render: (item) => formatNumber(item.users) },
  { key: 'responseRate', label: t.columns.responseRate, sort: 'responseRate', numeric: true, render: (item) => formatPercent(item.responseRate) },
  { key: 'completionRate', label: t.columns.completionRate, sort: 'completionRate', numeric: true, render: (item) => formatPercent(item.completionRate) },
  { key: 'refusalRate', label: t.columns.refusalRate, sort: 'refusalRate', numeric: true, render: (item) => formatPercent(item.refusalRate) },
  { key: 'overdueRate', label: t.columns.overdueRate, numeric: true, render: (item) => formatPercent(item.overdueRate) },
  { key: 'firstReply', label: t.columns.firstReply, sort: 'medianDaysToFirstReply', numeric: true, render: (item) => days(item.medianDaysToFirstReply) },
  { key: 'completion', label: t.columns.completion, numeric: true, render: (item) => days(item.medianDaysToCompletion) },
];

function LeaderboardTable({ items, sort, order }: { items: BrokerPerformanceDto[]; sort: LeaderboardSort; order: 'asc' | 'desc' }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-surface shadow-2xs">
      <table className="w-full min-w-[52rem] text-left text-sm">
        <caption className="sr-only">{t.caption}</caption>
        <thead className="border-b border-line bg-sunken/80 text-xs uppercase tracking-wider text-muted">
          <tr>
            <th scope="col" className="px-4 py-3 font-semibold">
              {t.columns.broker}
            </th>
            {COLUMNS.map((column) => (
              <th
                key={column.key}
                scope="col"
                aria-sort={column.sort === sort ? (order === 'asc' ? 'ascending' : 'descending') : undefined}
                className="px-4 py-3 text-right font-semibold"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {items.map((item) => (
            <tr key={item.broker.id} className="transition-colors hover:bg-sunken/40">
              <th scope="row" className="px-4 py-3.5 font-semibold text-fg">
                {item.broker.name}
                <span className="block text-xs font-normal text-muted">{it.categories[item.broker.category]}</span>
              </th>
              {COLUMNS.map((column) => (
                <td key={column.key} className="px-4 py-3.5 text-right font-mono text-xs tabular-nums">
                  {column.render(item)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Privacy({ data }: { data: LeaderboardDto }) {
  return (
    <Card className="space-y-2 border-primary/30 bg-primary-soft">
      <h2 className="flex items-center gap-2 text-base font-semibold">
        <Lock className="h-5 w-5 text-primary" aria-hidden="true" />
        {t.privacyTitle}
      </h2>
      <p className="text-sm">{t.privacyBody(data.minUsers)}</p>
      {data.hiddenBrokers > 0 && <p className="text-sm font-medium">{t.hidden(data.hiddenBrokers)}</p>}
    </Card>
  );
}

export function LeaderboardPage() {
  const [params, setParams] = useSearchParams();
  const sort = parseLeaderboardSort(params.get('sort'));
  const order = params.get('order') === 'asc' ? 'asc' : 'desc';
  const category = parseCategory(params.get('category'));

  const update = (changes: Record<string, string | null>) => {
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        for (const [key, value] of Object.entries(changes)) {
          if (value === null || value === '') next.delete(key);
          else next.set(key, value);
        }
        return next;
      },
      { replace: true },
    );
  };

  const query = useBrokerLeaderboard({ sort, order, category });

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-10 sm:px-6 sm:py-14">
      <header className="max-w-3xl space-y-2 border-b border-line pb-6">
        <h1 className="text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">{t.title}</h1>
        <p className="text-sm leading-relaxed text-muted sm:text-base">{t.intro}</p>
      </header>

      <Card>
        <form role="search" aria-label={it.common.filters} onSubmit={(event) => event.preventDefault()} className="grid gap-4 md:grid-cols-3">
          <SelectField label={t.sortLabel} value={sort} onChange={(event) => update({ sort: event.target.value })}>
            {LEADERBOARD_SORT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {t.sort[option]}
              </option>
            ))}
          </SelectField>
          <SelectField label={t.orderLabel} value={order} onChange={(event) => update({ order: event.target.value })}>
            <option value="desc">{t.order.desc}</option>
            <option value="asc">{t.order.asc}</option>
          </SelectField>
          <SelectField label={t.categoryLabel} value={category ?? ''} onChange={(event) => update({ category: event.target.value })}>
            <option value="">{t.allCategories}</option>
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {it.categories[option]}
              </option>
            ))}
          </SelectField>
        </form>
      </Card>

      <QueryBoundary query={query} errorMessage={t.loadError} skeleton={<SkeletonList rows={6} label={it.common.loading} />}>
        {(data) => (
          <div className="space-y-4">
            {data.items.length === 0 ? (
              <EmptyState icon={Trophy} title={t.emptyTitle} description={category ? t.emptyFiltered : t.emptyBody} />
            ) : (
              <>
                <p className="text-sm text-muted" aria-live="polite">
                  {it.common.results(data.items.length)} · {t.generatedAt(formatDateTime(data.generatedAt))}
                </p>
                <LeaderboardTable items={data.items} sort={sort} order={order} />
              </>
            )}
            <Privacy data={data} />
          </div>
        )}
      </QueryBoundary>
    </div>
  );
}
