import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useGmailComplete } from '@/api/mutations';
import { it } from '@/i18n/it';
import { describeError } from '@/lib/errors';
import { Alert } from '@/components/ui/Alert';
import { ButtonLink } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Skeleton } from '@/components/ui/Skeleton';

const t = it.gmailCallback;

/** Where Google sends the browser back (`/app/collega-google?code=...&state=...`): finishes the connection. */
export function GmailCallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const complete = useGmailComplete();
  // React may run the effect twice in development; the authorization code works only once.
  const started = useRef(false);

  const code = params.get('code');
  const state = params.get('state');
  const denied = params.get('error') !== null;

  useEffect(() => {
    if (started.current || denied || !code || !state) return;
    started.current = true;
    complete.mutate(
      { code, state },
      { onSuccess: ({ profileId }) => navigate(`/app/profili/${profileId}#mittente`, { replace: true }) },
    );
  }, [code, state, denied, complete, navigate]);

  return (
    <div className="space-y-6">
      <PageHeader title={t.title} />
      <Card className="space-y-4">
        {denied && <Alert tone="info">{t.denied}</Alert>}
        {!denied && (!code || !state) && <Alert tone="danger">{t.invalid}</Alert>}
        {!denied && code && state && !complete.isError && (
          <div role="status" aria-live="polite" className="space-y-2">
            <p className="text-sm text-muted">{t.working}</p>
            <Skeleton className="h-8 w-full" />
          </div>
        )}
        {complete.isError && (
          <Alert tone="danger" title={t.failedTitle}>
            {describeError(complete.error)[0]}
          </Alert>
        )}
        {(denied || !code || !state || complete.isError) && <ButtonLink to="/app/profili">{t.toProfiles}</ButtonLink>}
      </Card>
    </div>
  );
}
