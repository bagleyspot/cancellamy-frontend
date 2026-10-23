import { useState } from 'react';
import { RefreshCw, ShieldCheck } from 'lucide-react';
import { useAdminBrokers } from '@/api/queries';
import { useAdminAutoVerify, useAdminPatchBroker, useAdminReseed } from '@/api/mutations';
import type { BrokerDto, VerificationStatus } from '@/api/types';
import { it } from '@/i18n/it';
import { CATEGORY_OPTIONS, VERIFICATION_OPTIONS, parseCategory, parseVerification } from '@/lib/enums';
import { useDebouncedCallback } from '@/lib/useDebouncedCallback';
import { ApiErrorAlert } from '@/components/ApiErrorAlert';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Dialog } from '@/components/ui/Dialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { SelectField, TextAreaField, TextField } from '@/components/ui/Field';
import { Pagination } from '@/components/ui/Pagination';
import { QueryBoundary } from '@/components/ui/QueryBoundary';
import { SkeletonList } from '@/components/ui/Skeleton';

const LIMIT = 25;

function NotesForm({ broker, onClose }: { broker: BrokerDto; onClose: () => void }) {
  const patch = useAdminPatchBroker();
  const [text, setText] = useState(broker.notes ?? '');

  const save = () => {
    patch.mutate({ id: broker.id, patch: { notes: text.trim() === '' ? null : text } }, { onSuccess: onClose });
  };

  return (
    <div className="space-y-4">
      <TextAreaField label={it.admin.brokers.notes} rows={6} value={text} onChange={(event) => setText(event.target.value)} />
      <ApiErrorAlert error={patch.isError ? patch.error : null} />
      <div className="flex flex-wrap justify-end gap-3">
        <Button variant="secondary" onClick={onClose}>
          {it.common.cancel}
        </Button>
        <Button onClick={save} loading={patch.isPending}>
          {it.common.save}
        </Button>
      </div>
    </div>
  );
}

function NotesDialog({ broker, onClose }: { broker: BrokerDto | null; onClose: () => void }) {
  return (
    <Dialog open={broker !== null} onClose={onClose} title={broker ? it.admin.brokers.notesTitle(broker.name) : ''}>
      {broker && <NotesForm key={broker.id} broker={broker} onClose={onClose} />}
    </Dialog>
  );
}

export function AdminBrokersPage() {
  const t = it.admin.brokers;
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<BrokerDto | null>(null);
  const patch = useAdminPatchBroker();
  const reseed = useAdminReseed();
  const autoVerify = useAdminAutoVerify();

  const applySearch = useDebouncedCallback((value: string) => {
    setQ(value.trim());
    setPage(1);
  }, 300);

  const query = useAdminBrokers({
    q: q || undefined,
    category: parseCategory(category),
    status: parseVerification(status),
    page,
    limit: LIMIT,
  });

  const pendingId = patch.isPending ? patch.variables.id : null;

  return (
    <div className="space-y-4">
      <Card>
        <form role="search" onSubmit={(event) => event.preventDefault()} className="grid gap-4 md:grid-cols-4">
          <div className="md:col-span-2">
            <TextField
              label={t.searchLabel}
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                applySearch(event.target.value);
              }}
            />
          </div>
          <SelectField
            label={it.common.category}
            value={category}
            onChange={(event) => {
              setCategory(event.target.value);
              setPage(1);
            }}
          >
            <option value="">{t.allCategories}</option>
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {it.categories[option]}
              </option>
            ))}
          </SelectField>
          <SelectField
            label={t.verification}
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
          >
            <option value="">{t.allStatuses}</option>
            {VERIFICATION_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {it.verification[option]}
              </option>
            ))}
          </SelectField>
        </form>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="secondary" size="sm" onClick={() => reseed.mutate()} loading={reseed.isPending}>
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          {t.reseed}
        </Button>
        <Button variant="primary" size="sm" onClick={() => autoVerify.mutate(true)} loading={autoVerify.isPending}>
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          {t.autoVerify}
        </Button>
        {reseed.isSuccess && (
          <p role="status" className="text-sm font-medium text-success">
            {t.reseedDone(reseed.data.created, reseed.data.updated)}
          </p>
        )}
        {autoVerify.isSuccess && (
          <p role="status" className="text-sm font-medium text-success">
            {t.autoVerifyDone(autoVerify.data.promoted, autoVerify.data.discovered, autoVerify.data.sendable)}
          </p>
        )}
      </div>
      <ApiErrorAlert error={reseed.isError ? reseed.error : autoVerify.isError ? autoVerify.error : patch.isError ? patch.error : null} />
      {patch.isSuccess && <Alert tone="success">{t.saved}</Alert>}

      <QueryBoundary query={query} errorMessage={it.admin.loadError} skeleton={<SkeletonList rows={6} label={it.common.loading} />}>
        {(data) =>
          data.items.length === 0 ? (
            <EmptyState title={t.empty} />
          ) : (
            <>
              <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
                <table className="w-full min-w-[56rem] text-left text-sm">
                  <caption className="sr-only">{t.title}</caption>
                  <thead className="bg-sunken text-xs uppercase tracking-wide text-muted">
                    <tr>
                      <th scope="col" className="px-4 py-3">{it.common.name}</th>
                      <th scope="col" className="px-4 py-3">{it.common.category}</th>
                      <th scope="col" className="px-4 py-3">{t.verification}</th>
                      <th scope="col" className="px-4 py-3">{t.sendEnabled}</th>
                      <th scope="col" className="px-4 py-3">{t.notes}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {data.items.map((broker) => (
                      <tr key={broker.id}>
                        <th scope="row" className="px-4 py-3 font-medium">{broker.name}</th>
                        <td className="px-4 py-3 text-muted">{it.categories[broker.category]}</td>
                        <td className="px-4 py-3">
                          <label className="sr-only" htmlFor={`status-${broker.id}`}>
                            {t.verificationFor(broker.name)}
                          </label>
                          <select
                            id={`status-${broker.id}`}
                            value={broker.verificationStatus}
                            disabled={pendingId === broker.id}
                            onChange={(event) => {
                              const next = parseVerification(event.target.value);
                              if (next) patch.mutate({ id: broker.id, patch: { verificationStatus: next satisfies VerificationStatus } });
                            }}
                            className="min-h-9 rounded-lg border border-line bg-surface px-2 text-xs font-semibold text-fg"
                          >
                            {VERIFICATION_OPTIONS.map((option) => (
                              <option key={option} value={option}>
                                {it.verification[option]}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <label className="inline-flex min-h-9 items-center gap-2">
                            <input
                              type="checkbox"
                              role="switch"
                              className="h-5 w-5 accent-primary"
                              checked={broker.sendEnabled}
                              disabled={pendingId === broker.id}
                              aria-label={t.sendEnabledFor(broker.name)}
                              onChange={(event) => patch.mutate({ id: broker.id, patch: { sendEnabled: event.target.checked } })}
                            />
                            <span aria-hidden="true">{broker.sendEnabled ? it.common.toggleOn : it.common.toggleOff}</span>
                          </label>
                        </td>
                        <td className="px-4 py-3">
                          <Button variant="ghost" size="sm" onClick={() => setEditing(broker)} aria-label={t.editNotes(broker.name)}>
                            {broker.notes ? it.common.edit : it.common.add}
                          </Button>
                          {broker.notes && <span className="ml-1 line-clamp-1 max-w-48 align-middle text-xs text-muted">{broker.notes}</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={data.page} limit={data.limit} total={data.total} onPageChange={setPage} />
            </>
          )
        }
      </QueryBoundary>
      <NotesDialog broker={editing} onClose={() => setEditing(null)} />
    </div>
  );
}
