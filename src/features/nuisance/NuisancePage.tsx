import { useState } from 'react';
import { FileWarning } from 'lucide-react';
import { api } from '@/api/endpoints';
import { useNuisanceActions } from '@/api/mutations';
import { useNuisance } from '@/api/queries';
import type { ComplaintDto, NuisanceOverviewDto } from '@/api/types';
import { it } from '@/i18n/it';
import { formatDateTime } from '@/lib/format';
import { ApiErrorAlert } from '@/components/ApiErrorAlert';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card, CardTitle } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { QueryBoundary } from '@/components/ui/QueryBoundary';
import { SkeletonList } from '@/components/ui/Skeleton';
import { NoProfile } from '@/features/profiles/NoProfile';
import { ComplaintDialog } from '@/features/requests/ComplaintDialog';
import { useSelectedProfile } from '@/features/shell/ProfileContext';
import { ReportForm } from './ReportForm';
import { ReportList } from './ReportList';
import { RpoCard } from './RpoCard';

const t = it.nuisance;

function TopCallers({ callers }: { callers: NuisanceOverviewDto['topCallers'] }) {
  if (callers.length === 0) return null;
  return (
    <Card className="space-y-3" aria-labelledby="top-callers-title">
      <CardTitle id="top-callers-title">{t.top.title}</CardTitle>
      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full min-w-[30rem] text-left text-sm">
          <caption className="sr-only">{t.top.caption}</caption>
          <thead className="bg-sunken text-xs uppercase tracking-wide text-muted">
            <tr>
              <th scope="col" className="px-3 py-2 font-semibold">{t.top.caller}</th>
              <th scope="col" className="px-3 py-2 font-semibold">{t.top.company}</th>
              <th scope="col" className="px-3 py-2 text-right font-semibold">{t.top.count}</th>
              <th scope="col" className="px-3 py-2 font-semibold">{t.top.last}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {callers.map((caller, index) => (
              <tr key={`${caller.callerNumber ?? ''}|${caller.company ?? ''}|${index}`}>
                <th scope="row" className="px-3 py-2 font-medium">
                  {caller.callerNumber ?? t.list.unknownCaller}
                </th>
                <td className="px-3 py-2">{caller.company ?? it.common.notAvailable}</td>
                <td className="px-3 py-2 text-right tabular-nums">{caller.count}</td>
                <td className="px-3 py-2">{formatDateTime(caller.lastAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function ComplaintCard({ profileId, reportCount }: { profileId: string; reportCount: number }) {
  const { complaint } = useNuisanceActions(profileId);
  const [result, setResult] = useState<ComplaintDto | undefined>();

  return (
    <Card className="space-y-3" aria-labelledby="nuisance-complaint-title">
      <CardTitle id="nuisance-complaint-title">{t.complaint.title}</CardTitle>
      <p className="text-sm text-muted">{t.complaint.body}</p>
      {reportCount === 0 && <Alert tone="info">{t.complaint.needReports}</Alert>}
      <ApiErrorAlert error={complaint.isError ? complaint.error : null} />
      <Button
        variant="accent"
        onClick={() => complaint.mutate({ profileId }, { onSuccess: setResult })}
        loading={complaint.isPending}
        disabled={reportCount === 0}
      >
        <FileWarning className="h-4 w-4" aria-hidden="true" />
        {t.complaint.prepare}
      </Button>
      <ComplaintDialog
        fetchPdf={() => api.nuisance.complaintPdf(profileId)}
        pdfFileName="segnalazione-telemarketing.pdf"
        title={t.complaint.dialogTitle}
        complaint={result}
        onClose={() => setResult(undefined)}
      />
    </Card>
  );
}

export function NuisancePage() {
  const { selected, isLoading } = useSelectedProfile();
  const query = useNuisance(selected?.id);

  if (isLoading) return <SkeletonList label={it.common.loading} />;
  if (!selected) return <NoProfile description={t.noProfile} />;

  return (
    <div className="space-y-6">
      <PageHeader title={t.title} description={t.subtitle(`${selected.firstName} ${selected.lastName}`)} />
      <p className="max-w-3xl text-sm text-muted">{t.intro}</p>
      <QueryBoundary query={query} errorMessage={t.loadError} skeleton={<SkeletonList rows={3} label={it.common.loading} />}>
        {(overview) => (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <ReportForm key={selected.id} profile={selected} />
              <ReportList profileId={selected.id} reports={overview.reports} />
              <TopCallers callers={overview.topCallers} />
            </div>
            <div className="space-y-6">
              <RpoCard rpo={overview.rpo} />
              <ComplaintCard profileId={selected.id} reportCount={overview.reports.length} />
            </div>
          </div>
        )}
      </QueryBoundary>
    </div>
  );
}
