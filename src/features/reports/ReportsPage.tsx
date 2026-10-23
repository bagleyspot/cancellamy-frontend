import { FilePlus2, FileText } from 'lucide-react';
import { useReports } from '@/api/queries';
import { useGenerateReport } from '@/api/mutations';
import type { ReportDto } from '@/api/types';
import { it } from '@/i18n/it';
import { formatDate, formatNumber, formatPeriod } from '@/lib/format';
import { ApiErrorAlert } from '@/components/ApiErrorAlert';
import { Button } from '@/components/ui/Button';
import { Card, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { QueryBoundary } from '@/components/ui/QueryBoundary';
import { NoProfile } from '@/features/profiles/NoProfile';
import { useSelectedProfile } from '@/features/shell/ProfileContext';

const STAT_KEYS = ['sent', 'completed', 'refused', 'actionRequired', 'overdue', 'newlyCovered'] as const;

function ReportCard({ report }: { report: ReportDto }) {
  const t = it.reports;
  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <CardTitle className="capitalize">{formatPeriod(report.period)}</CardTitle>
        <p className="text-xs text-muted">{t.generatedOn(formatDate(report.createdAt))}</p>
      </div>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {STAT_KEYS.map((key) => (
          <div key={key} className="rounded-xl bg-sunken p-3">
            <dt className="text-xs text-muted">{t.stats[key]}</dt>
            <dd className="text-xl font-semibold tabular-nums">{formatNumber(report.stats[key])}</dd>
          </div>
        ))}
      </dl>
      {report.highlights.length > 0 && (
        <div className="space-y-1.5">
          <h3 className="text-sm font-semibold">{t.highlights}</h3>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
            {report.highlights.map((highlight) => (
              <li key={highlight}>{highlight}</li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

export function ReportsPage() {
  const t = it.reports;
  const { selected } = useSelectedProfile();
  const query = useReports(selected?.id);
  const generate = useGenerateReport();

  if (!selected) return <NoProfile description={t.noProfile} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.title}
        description={t.subtitle(`${selected.firstName} ${selected.lastName}`)}
        actions={
          <Button onClick={() => generate.mutate(selected.id)} loading={generate.isPending}>
            <FilePlus2 className="h-4 w-4" aria-hidden="true" />
            {generate.isPending ? t.generating : t.generate}
          </Button>
        }
      />
      <ApiErrorAlert error={generate.isError ? generate.error : null} />
      <QueryBoundary query={query} errorMessage={t.loadError}>
        {(reports) =>
          reports.length === 0 ? (
            <EmptyState icon={FileText} title={t.emptyTitle} description={t.emptyBody} />
          ) : (
            <ul className="space-y-4">
              {reports.map((report) => (
                <li key={report.id}>
                  <ReportCard report={report} />
                </li>
              ))}
            </ul>
          )
        }
      </QueryBoundary>
    </div>
  );
}
