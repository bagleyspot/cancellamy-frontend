import { useState } from 'react';
import { ExternalLink as ExternalLinkIcon, Trash2 } from 'lucide-react';
import { useDeleteDelisting, useUpdateDelisting } from '@/api/mutations';
import { useDelisting, useDelistingGuide } from '@/api/queries';
import type { DelistingDto, DelistingGuideDto } from '@/api/types';
import { it } from '@/i18n/it';
import { allowedDelistingTransitions } from '@/lib/delisting';
import type { DelistingTarget } from '@/lib/delisting';
import { formatDate } from '@/lib/format';
import { ApiErrorAlert } from '@/components/ApiErrorAlert';
import { CopyButton } from '@/components/CopyButton';
import { Alert } from '@/components/ui/Alert';
import { Button, ExternalLink } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Dialog } from '@/components/ui/Dialog';
import { TextAreaField } from '@/components/ui/Field';
import { QueryBoundary } from '@/components/ui/QueryBoundary';
import { SkeletonList } from '@/components/ui/Skeleton';
import { DelistingStatusBadge } from './DelistingStatusBadge';

const t = it.delisting.detail;

function Guide({ guide }: { guide: DelistingGuideDto }) {
  return (
    <section aria-labelledby="delisting-guide" className="space-y-4 rounded-xl border border-line p-4">
      <h3 id="delisting-guide" className="text-base font-semibold">
        {t.guideTitle(guide.engineName)}
      </h3>
      <div className="space-y-1.5">
        <h4 className="text-sm font-semibold">{t.steps}</h4>
        <ol className="list-decimal space-y-1.5 pl-5 text-sm">
          {guide.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </div>
      <div className="space-y-2">
        <h4 className="text-sm font-semibold">{t.statement}</h4>
        <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-xl border border-line bg-sunken p-3 text-sm">{guide.statement}</pre>
        <CopyButton text={guide.statement} />
      </div>
      {guide.formUrl ? (
        <ExternalLink href={guide.formUrl} asButton>
          {t.openForm}
          <ExternalLinkIcon className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only"> {it.common.externalLink}</span>
        </ExternalLink>
      ) : (
        <p className="text-sm text-muted">{t.noForm}</p>
      )}
      {guide.tips.length > 0 && (
        <div className="space-y-1.5">
          <h4 className="text-sm font-semibold">{t.tips}</h4>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
            {guide.tips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</dt>
      <dd className="break-words text-sm">{children}</dd>
    </div>
  );
}

interface ActionsProps {
  delisting: DelistingDto;
  onCancelRequested: () => void;
}

function Actions({ delisting, onCancelRequested }: ActionsProps) {
  const update = useUpdateDelisting(delisting.id);
  const [note, setNote] = useState(delisting.note ?? '');
  const [noteSaved, setNoteSaved] = useState(false);
  const targets = allowedDelistingTransitions(delisting.status);
  const hint = it.delisting.actionHint[delisting.status];

  const move = (status: DelistingTarget) => {
    if (status === 'cancelled') {
      onCancelRequested();
      return;
    }
    setNoteSaved(false);
    const trimmed = note.trim();
    update.mutate({ status, ...(trimmed && { note: trimmed }) });
  };

  return (
    <section aria-labelledby="delisting-actions" className="space-y-3">
      <h3 id="delisting-actions" className="text-base font-semibold">
        {t.actionsTitle}
      </h3>
      {targets.length === 0 ? (
        <p className="text-sm text-muted">{t.closed}</p>
      ) : (
        <>
          {hint && <p className="text-sm text-muted">{hint}</p>}
          <div className="flex flex-wrap gap-2">
            {targets.map((status) => (
              <Button
                key={status}
                variant={status === 'cancelled' ? 'danger' : status === 'submitted' || status === 'appealed' ? 'primary' : 'secondary'}
                onClick={() => move(status)}
                disabled={update.isPending}
              >
                {it.delisting.actions[status]}
              </Button>
            ))}
          </div>
        </>
      )}
      <TextAreaField label={`${t.note} ${it.common.optional}`} hint={t.noteHint} rows={3} value={note} onChange={(event) => setNote(event.target.value)} />
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => update.mutate({ note: note.trim() }, { onSuccess: () => setNoteSaved(true) })}
          loading={update.isPending}
        >
          {t.saveNote}
        </Button>
        {noteSaved && (
          <span role="status" className="text-sm text-muted">
            {t.noteSaved}
          </span>
        )}
      </div>
      <ApiErrorAlert error={update.isError ? update.error : null} />
    </section>
  );
}

interface DelistingDetailProps {
  id: string | null;
  onClose: () => void;
}

/** Detail "drawer" (modal): request data, guide, allowed status actions, cancel and delete. */
export function DelistingDetail({ id, onClose }: DelistingDetailProps) {
  const query = useDelisting(id);
  const guide = useDelistingGuide(id);
  const remove = useDeleteDelisting();
  const update = useUpdateDelisting(id ?? '');
  const [confirm, setConfirm] = useState<'cancel' | 'delete' | null>(null);

  const closeAll = () => {
    setConfirm(null);
    onClose();
  };

  return (
    <>
      <Dialog open={id !== null} onClose={onClose} title={t.title} size="lg">
        <QueryBoundary query={query} errorMessage={t.loadError} skeleton={<SkeletonList rows={3} label={it.common.loading} />}>
          {(delisting) => (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <DelistingStatusBadge status={delisting.status} />
                <span className="text-sm font-medium">{it.delisting.engine[delisting.engine]}</span>
              </div>
              <dl className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Row label={t.url}>
                    <a href={delisting.url} target="_blank" rel="noopener noreferrer" className="break-all font-medium text-primary underline underline-offset-2">
                      {delisting.url}
                      <span className="sr-only"> {it.common.externalLink}</span>
                    </a>
                  </Row>
                </div>
                {delisting.searchQuery && <Row label={t.query}>{delisting.searchQuery}</Row>}
                <Row label={t.reason}>{it.delisting.reason[delisting.reason]}</Row>
                {delisting.explanation && (
                  <div className="sm:col-span-2">
                    <Row label={t.explanation}>
                      <span className="whitespace-pre-wrap">{delisting.explanation}</span>
                    </Row>
                  </div>
                )}
                {delisting.submittedAt && <Row label={t.submittedAt}>{formatDate(delisting.submittedAt)}</Row>}
                {delisting.resolvedAt && <Row label={t.resolvedAt}>{formatDate(delisting.resolvedAt)}</Row>}
              </dl>
              {delisting.followUpAt && (
                <Alert tone="info" title={t.followUp}>
                  <p>{t.followUpHint(formatDate(delisting.followUpAt))}</p>
                </Alert>
              )}

              <QueryBoundary query={guide} errorMessage={t.guideLoadError} skeleton={<SkeletonList rows={2} label={it.common.loading} />}>
                {(data) => <Guide guide={data} />}
              </QueryBoundary>

              <Actions key={`${delisting.id}:${delisting.status}`} delisting={delisting} onCancelRequested={() => setConfirm('cancel')} />

              <div className="border-t border-line pt-4">
                <Button variant="danger" size="sm" onClick={() => setConfirm('delete')}>
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  {t.delete}
                </Button>
              </div>
            </div>
          )}
        </QueryBoundary>
      </Dialog>

      <ConfirmDialog
        open={confirm === 'cancel'}
        title={t.cancelTitle}
        description={t.cancelBody}
        confirmLabel={t.cancelConfirm}
        danger
        pending={update.isPending}
        error={update.isError ? update.error : undefined}
        onClose={() => setConfirm(null)}
        onConfirm={() => update.mutate({ status: 'cancelled' }, { onSuccess: () => setConfirm(null) })}
      />
      <ConfirmDialog
        open={confirm === 'delete'}
        title={t.deleteTitle}
        description={t.deleteBody}
        confirmLabel={t.deleteConfirm}
        danger
        pending={remove.isPending}
        error={remove.isError ? remove.error : undefined}
        onClose={() => setConfirm(null)}
        onConfirm={() => id !== null && remove.mutate(id, { onSuccess: closeAll })}
      />
    </>
  );
}
