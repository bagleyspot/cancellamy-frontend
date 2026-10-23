import { Map as MapIcon } from 'lucide-react';
import { Link } from 'react-router';
import { useDataMap } from '@/api/queries';
import type { DataMapDto, DataMapEntry } from '@/api/types';
import { it } from '@/i18n/it';
import { Badge } from '@/components/ui/Badge';
import { Card, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { QueryBoundary } from '@/components/ui/QueryBoundary';
import { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/features/requests/StatusBadge';

const t = it.access;

function Totals({ totals }: { totals: DataMapDto['totals'] }) {
  const items = [
    { label: t.totals.asked, value: totals.asked },
    { label: t.totals.answered, value: totals.answered },
    { label: t.totals.found, value: totals.found },
    { label: t.totals.notFound, value: totals.notFound },
  ];
  return (
    <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-xl border border-line p-3">
          <dt className="text-xs text-muted">{item.label}</dt>
          <dd className="text-2xl font-semibold tabular-nums">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function FoundBadge({ found }: { found: DataMapEntry['found'] }) {
  if (found === null) return <Badge>{t.found.unknown}</Badge>;
  return <Badge tone={found ? 'warning' : 'success'}>{found ? t.found.yes : t.found.no}</Badge>;
}

function Entries({ entries }: { entries: DataMapEntry[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line">
      <table className="w-full min-w-[40rem] text-left text-sm">
        <caption className="sr-only">{t.table.caption}</caption>
        <thead className="bg-sunken text-xs uppercase tracking-wide text-muted">
          <tr>
            <th scope="col" className="px-3 py-2 font-semibold">{t.table.broker}</th>
            <th scope="col" className="px-3 py-2 font-semibold">{t.table.status}</th>
            <th scope="col" className="px-3 py-2 font-semibold">{t.table.found}</th>
            <th scope="col" className="px-3 py-2 font-semibold">{t.table.categories}</th>
            <th scope="col" className="px-3 py-2 font-semibold">
              <span className="sr-only">{t.table.details}</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {entries.map((entry) => (
            <tr key={entry.requestId}>
              <th scope="row" className="px-3 py-2 font-medium">
                {entry.broker.name}
                <span className="block font-mono text-xs font-normal text-muted">{entry.shortRef}</span>
              </th>
              <td className="px-3 py-2">
                <StatusBadge status={entry.status} />
              </td>
              <td className="px-3 py-2">
                <FoundBadge found={entry.found} />
              </td>
              <td className="px-3 py-2">
                {entry.categories.length === 0 ? (
                  <span className="text-muted">{it.common.notAvailable}</span>
                ) : (
                  <ul className="flex flex-wrap gap-1">
                    {entry.categories.map((category) => (
                      <li key={category} className="rounded-full bg-sunken px-2 py-0.5 text-xs">
                        {it.dataCategories[category]}
                      </li>
                    ))}
                  </ul>
                )}
              </td>
              <td className="px-3 py-2 text-right">
                <Link
                  to={`/app/richieste/${entry.requestId}`}
                  aria-label={t.open(entry.broker.name)}
                  className="font-medium text-primary underline underline-offset-2"
                >
                  {it.common.open}
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DataMap({ profileId }: { profileId: string }) {
  const query = useDataMap(profileId);
  return (
    <Card className="space-y-5" aria-labelledby="map-title">
      <div className="space-y-1">
        <CardTitle id="map-title">{t.mapTitle}</CardTitle>
        <p className="text-sm text-muted">{t.mapIntro}</p>
      </div>
      <QueryBoundary
        query={query}
        errorMessage={t.mapLoadError}
        skeleton={
          <SkeletonGroup label={it.common.loading} className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
          </SkeletonGroup>
        }
      >
        {(map) =>
          map.entries.length === 0 ? (
            <EmptyState icon={MapIcon} title={t.mapEmptyTitle} description={t.mapEmptyBody} />
          ) : (
            <>
              <Totals totals={map.totals} />
              <section aria-labelledby="map-categories" className="space-y-2">
                <h3 id="map-categories" className="text-sm font-semibold">
                  {t.categoriesTitle}
                </h3>
                {map.categoryCounts.length === 0 ? (
                  <p className="text-sm text-muted">{t.categoriesEmpty}</p>
                ) : (
                  <ul className="flex flex-wrap gap-2">
                    {map.categoryCounts.map((entry) => (
                      <li key={entry.category} className="flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-sm">
                        {it.dataCategories[entry.category]}
                        <span className="rounded-full bg-primary-soft px-2 text-xs font-semibold tabular-nums text-primary">{entry.count}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
              <Entries entries={map.entries} />
            </>
          )
        }
      </QueryBoundary>
    </Card>
  );
}
