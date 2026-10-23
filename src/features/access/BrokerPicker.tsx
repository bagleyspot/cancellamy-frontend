import { useState } from 'react';
import { Search } from 'lucide-react';
import { useCreateAccessRequests } from '@/api/mutations';
import { useBrokers } from '@/api/queries';
import type { CreateAccessRequestsResponse, ProfileDto } from '@/api/types';
import { it } from '@/i18n/it';
import { useDebouncedCallback } from '@/lib/useDebouncedCallback';
import { ApiErrorAlert } from '@/components/ApiErrorAlert';
import { Alert } from '@/components/ui/Alert';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Card, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { TextField } from '@/components/ui/Field';
import { Pagination } from '@/components/ui/Pagination';
import { QueryBoundary } from '@/components/ui/QueryBoundary';
import { SkeletonList } from '@/components/ui/Skeleton';

const t = it.access;
export const MAX_ACCESS_BROKERS = 20;
const PAGE_SIZE = 20;

interface SubmitResult {
  created: CreateAccessRequestsResponse['created'];
  skipped: { brokerId: string; name: string; reason: CreateAccessRequestsResponse['skipped'][number]['reason'] }[];
}

function Result({ result }: { result: SubmitResult }) {
  return (
    <div className="space-y-3" aria-live="polite">
      <h3 className="text-base font-semibold">{t.resultTitle}</h3>
      {result.created.length > 0 && (
        <Alert tone="success" title={t.created(result.created.length)}>
          <ul className="space-y-1">
            {result.created.map((item) => (
              <li key={item.id}>
                <ButtonLink to={`/app/richieste/${item.id}`} variant="ghost" size="sm" aria-label={t.viewRequest(item.broker.name)}>
                  {item.broker.name}
                </ButtonLink>
              </li>
            ))}
          </ul>
        </Alert>
      )}
      {result.skipped.length > 0 && (
        <Alert tone="warning" title={t.skippedTitle}>
          <ul className="list-disc space-y-1 pl-5">
            {result.skipped.map((item) => (
              <li key={item.brokerId}>{t.skippedItem(item.name, t.skippedReason[item.reason])}</li>
            ))}
          </ul>
        </Alert>
      )}
    </div>
  );
}

export function BrokerPicker({ profile }: { profile: ProfileDto }) {
  const create = useCreateAccessRequests();
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  // id -> name, so the selection survives pagination and search changes.
  const [selection, setSelection] = useState<ReadonlyMap<string, string>>(new Map());
  const [result, setResult] = useState<SubmitResult | null>(null);

  const applySearch = useDebouncedCallback((value: string) => {
    setQ(value.trim());
    setPage(1);
  }, 300);
  const query = useBrokers({ q: q || undefined, sendable: true, page, limit: PAGE_SIZE });

  const full = selection.size >= MAX_ACCESS_BROKERS;

  const toggle = (id: string, name: string, checked: boolean) => {
    const next = new Map(selection);
    if (checked) next.set(id, name);
    else next.delete(id);
    setSelection(next);
  };

  const submit = () => {
    const names = new Map(selection);
    create.mutate(
      { profileId: profile.id, brokerIds: [...names.keys()] },
      {
        onSuccess: (response) => {
          setResult({
            created: response.created,
            skipped: response.skipped.map((item) => ({ ...item, name: names.get(item.brokerId) ?? item.brokerId })),
          });
          setSelection(new Map());
        },
      },
    );
  };

  return (
    <Card className="space-y-4" aria-labelledby="picker-title">
      <div className="space-y-1">
        <CardTitle id="picker-title">{t.pickerTitle}</CardTitle>
        <p className="text-sm text-muted">{t.pickerHint}</p>
      </div>
      <form role="search" onSubmit={(event) => event.preventDefault()}>
        <TextField
          label={t.searchLabel}
          type="search"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            applySearch(event.target.value);
          }}
        />
      </form>

      <QueryBoundary query={query} errorMessage={t.pickerLoadError} skeleton={<SkeletonList rows={5} label={it.common.loading} />}>
        {(data) => {
          const items = data.items.filter((broker) => broker.sendEnabled);
          return items.length === 0 ? (
            <EmptyState icon={Search} title={t.pickerEmpty} />
          ) : (
            <>
              <ul className="grid gap-2 sm:grid-cols-2" aria-label={t.pickerTitle}>
                {items.map((broker) => {
                  const checked = selection.has(broker.id);
                  const id = `access-broker-${broker.id}`;
                  return (
                    <li key={broker.id} className="flex items-start gap-3 rounded-xl border border-line p-3">
                      <input
                        id={id}
                        type="checkbox"
                        checked={checked}
                        disabled={!checked && full}
                        onChange={(event) => toggle(broker.id, broker.name, event.target.checked)}
                        className="mt-0.5 h-5 w-5 shrink-0 rounded border-line accent-primary"
                      />
                      <label htmlFor={id} className="min-w-0 text-sm">
                        <span className="block font-medium">{broker.name}</span>
                        <span className="block text-xs text-muted">{it.categories[broker.category]}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
              <Pagination page={data.page} limit={data.limit} total={data.total} onPageChange={setPage} />
            </>
          );
        }}
      </QueryBoundary>

      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
        <p className="text-sm font-medium" aria-live="polite">
          {t.selected(selection.size, MAX_ACCESS_BROKERS)}
        </p>
        {full && <p className="text-sm text-muted">{t.maxReached(MAX_ACCESS_BROKERS)}</p>}
        <div className="ml-auto flex flex-wrap gap-2">
          {selection.size > 0 && (
            <Button variant="ghost" onClick={() => setSelection(new Map())}>
              {t.clearSelection}
            </Button>
          )}
          <Button onClick={submit} loading={create.isPending} disabled={selection.size === 0}>
            {t.submit}
          </Button>
        </div>
      </div>
      <ApiErrorAlert error={create.isError ? create.error : null} />
      {result && <Result result={result} />}
    </Card>
  );
}
