import { useState } from 'react';
import { skipToken, useMutation, useQuery } from '@tanstack/react-query';
import { BellRing, CheckCircle2, Download, FileWarning, XCircle } from 'lucide-react';
import { api } from '@/api/endpoints';
import { queryKeys } from '@/api/queries';
import { useRequestActions } from '@/api/mutations';
import type { ComplaintDto, OutcomeRequest, RequestDetail, SimulateReplyRequest } from '@/api/types';
import { it } from '@/i18n/it';
import { downloadBlob } from '@/lib/files';
import { ApiErrorAlert } from '@/components/ApiErrorAlert';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ComplaintDialog } from './ComplaintDialog';
import { ManualInstructions } from './ManualInstructions';
import { getRequestActions } from './permissions';
import { ProvideIdForm } from './ProvideIdForm';

const OUTCOMES: OutcomeRequest['outcome'][] = ['completed', 'refused', 'action_required', 'in_progress'];
const SIMULATIONS: SimulateReplyRequest['kind'][] = ['completed', 'refused', 'id_required', 'unknown'];

function Section({ title, body, children }: { title: string; body?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-base font-semibold">{title}</h3>
      {body && <p className="text-sm text-muted">{body}</p>}
      {children}
    </section>
  );
}

export function ActionsPanel({ detail }: { detail: RequestDetail }) {
  const t = it.requests;
  const flags = getRequestActions(detail);
  const actions = useRequestActions(detail.id);
  const [confirmEscalate, setConfirmEscalate] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [showComplaint, setShowComplaint] = useState(false);

  // The complaint text is returned by the escalate call (also when repeated): it is kept in the query cache.
  const cachedComplaint = useQuery<ComplaintDto>({ queryKey: queryKeys.complaint(detail.id), queryFn: skipToken }).data;
  const pdf = useMutation({
    mutationFn: async () => downloadBlob(await api.requests.complaintPdf(detail.id), `reclamo-${detail.shortRef}.pdf`),
  });

  const { markDone, outcome, provideId, remind, escalate, simulateReply } = actions;
  const failed = [markDone, outcome, provideId, remind, simulateReply, pdf].find((mutation) => mutation.isError);
  const anyAction = flags.markDone || flags.provideId || flags.remind || flags.escalate || flags.outcome || flags.cancel || flags.complaintPdf;

  return (
    <>
      <Card className="space-y-6">
        <h2 className="text-lg font-semibold">{t.detail.actions}</h2>

        {!anyAction && <p className="text-sm text-muted">{t.detail.noActions}</p>}

        {flags.markDone && (
          <Section title={t.manual.title}>
            {detail.manual && <ManualInstructions manual={detail.manual} />}
            <p className="text-sm text-muted">{t.manual.markDoneHint}</p>
            <Button onClick={() => markDone.mutate()} loading={markDone.isPending}>
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              {t.manual.markDone}
            </Button>
          </Section>
        )}

        {flags.provideId && (
          <ProvideIdForm
            onSubmit={(input) => provideId.mutate(input)}
            pending={provideId.isPending}
            error={provideId.isError ? provideId.error : null}
          />
        )}

        {flags.outcome && (
          <Section title={t.outcome.title} body={t.outcome.body}>
            <div className="flex flex-wrap gap-2">
              {OUTCOMES.map((value) => (
                <Button
                  key={value}
                  variant={value === 'completed' ? 'primary' : 'secondary'}
                  onClick={() => outcome.mutate({ outcome: value })}
                  disabled={outcome.isPending}
                >
                  {value === 'completed' && detail.kind === 'access' ? it.findings.completedAccess : t.outcome[value]}
                </Button>
              ))}
            </div>
          </Section>
        )}

        {flags.remind && (
          <Section title={t.reminder.title} body={t.reminder.body}>
            <Button variant="secondary" onClick={() => remind.mutate()} loading={remind.isPending}>
              <BellRing className="h-4 w-4" aria-hidden="true" />
              {t.reminder.submit}
            </Button>
          </Section>
        )}

        {flags.escalate && (
          <Section title={t.escalate.title} body={t.escalate.body}>
            <Button variant="accent" onClick={() => setConfirmEscalate(true)}>
              <FileWarning className="h-4 w-4" aria-hidden="true" />
              {t.escalate.submit}
            </Button>
          </Section>
        )}

        {flags.complaintPdf && (
          <Section title={t.escalate.title} body={t.escalate.escalatedHint}>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                loading={escalate.isPending}
                onClick={() =>
                  cachedComplaint
                    ? setShowComplaint(true)
                    : // The API returns the draft again for an already escalated request (idempotent).
                      escalate.mutate(undefined, { onSuccess: () => setShowComplaint(true) })
                }
              >
                {t.escalate.done}
              </Button>
              <Button variant="secondary" onClick={() => pdf.mutate()} loading={pdf.isPending}>
                <Download className="h-4 w-4" aria-hidden="true" />
                {t.escalate.downloadPdf}
              </Button>
            </div>
          </Section>
        )}

        {flags.cancel && (
          <div className="border-t border-line pt-4">
            <Button variant="danger" size="sm" onClick={() => setConfirmCancel(true)}>
              <XCircle className="h-4 w-4" aria-hidden="true" />
              {t.cancel.open}
            </Button>
          </div>
        )}

        {failed && <ApiErrorAlert error={failed.error} />}
      </Card>

      {flags.simulate && (
        <Card className="space-y-3 border-dashed border-warning/60">
          <h2 className="text-base font-semibold">{t.simulate.title}</h2>
          <p className="text-sm text-muted">{t.simulate.body}</p>
          <div className="flex flex-wrap gap-2">
            {SIMULATIONS.map((kind) => (
              <Button key={kind} variant="secondary" size="sm" onClick={() => simulateReply.mutate({ kind })} disabled={simulateReply.isPending}>
                {t.simulate[kind]}
              </Button>
            ))}
          </div>
        </Card>
      )}

      <ConfirmDialog
        open={confirmEscalate}
        title={t.escalate.confirmTitle}
        description={t.escalate.confirmBody}
        confirmLabel={t.escalate.submit}
        pending={escalate.isPending}
        error={escalate.isError ? escalate.error : undefined}
        onClose={() => setConfirmEscalate(false)}
        onConfirm={() =>
          escalate.mutate(undefined, {
            onSuccess: () => {
              setConfirmEscalate(false);
              setShowComplaint(true);
            },
          })
        }
      />
      <ConfirmDialog
        open={confirmCancel}
        title={t.cancel.title}
        description={t.cancel.body}
        confirmLabel={t.cancel.confirm}
        danger
        pending={actions.cancel.isPending}
        error={actions.cancel.isError ? actions.cancel.error : undefined}
        onClose={() => setConfirmCancel(false)}
        onConfirm={() => actions.cancel.mutate(undefined, { onSuccess: () => setConfirmCancel(false) })}
      />
      <ComplaintDialog
        fetchPdf={() => api.requests.complaintPdf(detail.id)}
        pdfFileName={`reclamo-${detail.shortRef}.pdf`}
        complaint={showComplaint ? cachedComplaint : undefined}
        onClose={() => setShowComplaint(false)}
      />
    </>
  );
}
