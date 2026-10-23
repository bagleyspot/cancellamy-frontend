import { ShieldAlert } from 'lucide-react';
import { Link } from 'react-router';
import { isApiError } from '@/api/http';
import { useCheckBreaches } from '@/api/mutations';
import { useBreaches } from '@/api/queries';
import type { BreachDto, BreachEmailDto, ProfileDto } from '@/api/types';
import { it } from '@/i18n/it';
import { describeError, isFeatureDisabled } from '@/lib/errors';
import { formatDate, formatDateTime } from '@/lib/format';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Button, ExternalLink } from '@/components/ui/Button';
import { Card, CardTitle } from '@/components/ui/Card';
import { QueryBoundary } from '@/components/ui/QueryBoundary';
import { Skeleton } from '@/components/ui/Skeleton';

const t = it.breaches;
const HIBP_URL = 'https://haveibeenpwned.com';

function BreachItem({ breach }: { breach: BreachDto }) {
  return (
    <li className="space-y-2 rounded-xl border border-line p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">{breach.title}</span>
        {breach.isSensitive && <Badge tone="danger">{t.sensitive}</Badge>}
        <Badge tone={breach.isVerified ? 'info' : 'neutral'}>{breach.isVerified ? t.verifiedBreach : t.unverifiedBreach}</Badge>
        {breach.breachDate && <span className="ml-auto text-xs text-muted">{t.breachDate(formatDate(breach.breachDate))}</span>}
      </div>
      {breach.dataClasses.length > 0 && (
        <div>
          <p className="sr-only">{t.dataClasses}</p>
          <ul aria-label={t.dataClasses} className="flex flex-wrap gap-1.5">
            {breach.dataClasses.map((dataClass) => (
              <li key={dataClass} className="rounded-full bg-sunken px-2.5 py-0.5 text-xs">
                {dataClass}
              </li>
            ))}
          </ul>
        </div>
      )}
    </li>
  );
}

function EmailBreaches({ entry }: { entry: BreachEmailDto }) {
  return (
    <section aria-label={entry.email} className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="break-all text-sm font-semibold">{entry.email}</h3>
        <p className="text-xs text-muted">{entry.lastCheckedAt ? t.lastChecked(formatDateTime(entry.lastCheckedAt)) : t.neverChecked}</p>
      </div>
      {entry.status === 'pending' && <p className="text-sm text-muted" role="status">{t.pending}</p>}
      {entry.status === 'error' && <Alert tone="warning">{t.error}</Alert>}
      {entry.status === 'checked' &&
        (entry.breaches.length === 0 ? (
          <p className="text-sm text-success">{t.none}</p>
        ) : (
          <>
            <p className="text-sm font-medium">{t.count(entry.breaches.length)}</p>
            <ul className="space-y-2">
              {entry.breaches.map((breach) => (
                <BreachItem key={breach.name} breach={breach} />
              ))}
            </ul>
          </>
        ))}
    </section>
  );
}

export function BreachesCard({ profile }: { profile: ProfileDto }) {
  const query = useBreaches(profile.id);
  const check = useCheckBreaches(profile.id);
  if (query.isError && isFeatureDisabled(query.error)) return null;

  const rateLimited = check.isError && isApiError(check.error) && check.error.status === 429;

  return (
    <Card className="space-y-4" aria-labelledby="violazioni-title" id="violazioni">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-primary" aria-hidden="true" />
          <CardTitle id="violazioni-title">{t.title}</CardTitle>
        </div>
        {query.data?.enabled && (
          <Button variant="secondary" size="sm" onClick={() => check.mutate()} loading={check.isPending}>
            {t.check}
          </Button>
        )}
      </div>
      <p className="text-sm text-muted">{t.intro}</p>
      {check.isSuccess && <Alert tone="success">{t.queued}</Alert>}
      {rateLimited && <Alert tone="warning">{t.rateLimited}</Alert>}
      {check.isError && !rateLimited && (
        <Alert tone="danger">
          {describeError(check.error).map((line) => (
            <p key={line}>{line}</p>
          ))}
        </Alert>
      )}
      <QueryBoundary query={query} errorMessage={t.loadError} skeleton={<Skeleton className="h-24 w-full" />}>
        {(summary) =>
          !summary.enabled ? (
            <Alert tone="info">{t.disabled}</Alert>
          ) : (
            <div className="space-y-5">
              {summary.emails.length === 0 ? (
                <p className="text-sm text-muted">{t.noEmails}</p>
              ) : (
                summary.emails.map((entry) => <EmailBreaches key={entry.email} entry={entry} />)
              )}
              {summary.unverifiedEmails.length > 0 && (
                <Alert tone="warning">
                  <p>{t.unverifiedNote(summary.unverifiedEmails.length)}</p>
                  <ul className="list-disc pl-5">
                    {summary.unverifiedEmails.map((email) => (
                      <li key={email} className="break-all">
                        {email}
                      </li>
                    ))}
                  </ul>
                  <Link to="#identita" className="font-medium text-primary underline underline-offset-2">
                    {t.goToIdentity}
                  </Link>
                </Alert>
              )}
              <p className="text-xs text-muted">{t.advice}</p>
              <p className="text-xs text-muted">
                {summary.attribution}{' '}
                <ExternalLink href={HIBP_URL}>
                  {t.attributionLinkLabel}
                </ExternalLink>
              </p>
            </div>
          )
        }
      </QueryBoundary>
    </Card>
  );
}
