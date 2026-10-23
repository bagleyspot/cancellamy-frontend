import { useState } from 'react';
import { PhoneOff, Trash2 } from 'lucide-react';
import { useNuisanceActions } from '@/api/mutations';
import type { NuisanceReportDto } from '@/api/types';
import { it } from '@/i18n/it';
import { formatDateTime } from '@/lib/format';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardTitle } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';

const t = it.nuisance.list;

function reportLabel(report: NuisanceReportDto): string {
  return report.callerNumber ?? report.company ?? t.unknownCaller;
}

export function ReportList({ profileId, reports }: { profileId: string; reports: NuisanceReportDto[] }) {
  const { remove } = useNuisanceActions(profileId);
  const [toDelete, setToDelete] = useState<NuisanceReportDto | null>(null);

  return (
    <Card className="space-y-4" aria-labelledby="nuisance-list-title">
      <CardTitle id="nuisance-list-title">{t.title}</CardTitle>
      {reports.length === 0 ? (
        <EmptyState icon={PhoneOff} title={t.emptyTitle} description={t.emptyBody} />
      ) : (
        <ul className="space-y-3">
          {reports.map((report) => (
            <li key={report.id} className="space-y-2 rounded-xl border border-line p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{reportLabel(report)}</span>
                <Badge tone="neutral">{it.nuisance.channels[report.channel]}</Badge>
                {report.rpoActiveAtTime === true && <Badge tone="success">{t.rpoActive}</Badge>}
                {report.rpoActiveAtTime === false && <Badge tone="neutral">{t.rpoInactive}</Badge>}
                <time dateTime={report.receivedAt} className="ml-auto text-xs text-muted">
                  {formatDateTime(report.receivedAt)}
                </time>
              </div>
              {report.company && report.callerNumber && <p className="text-sm text-muted">{report.company}</p>}
              {report.summary && <p className="text-sm">{report.summary}</p>}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-muted">{it.nuisance.consentShort[report.consentGiven]}</p>
                <Button variant="ghost" size="sm" onClick={() => setToDelete(report)} aria-label={t.delete(reportLabel(report))}>
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  {it.common.delete}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <ConfirmDialog
        open={toDelete !== null}
        title={t.deleteTitle}
        description={t.deleteBody}
        confirmLabel={t.deleteConfirm}
        danger
        pending={remove.isPending}
        error={remove.isError ? remove.error : undefined}
        onClose={() => setToDelete(null)}
        onConfirm={() => toDelete && remove.mutate(toDelete.id, { onSuccess: () => setToDelete(null) })}
      />
    </Card>
  );
}
