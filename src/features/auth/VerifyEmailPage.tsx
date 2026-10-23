import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router';
import { api } from '@/api/endpoints';
import { it } from '@/i18n/it';
import { ApiErrorAlert } from '@/components/ApiErrorAlert';
import { Alert } from '@/components/ui/Alert';
import { ButtonLink } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { AuthCard } from './AuthCard';
import { useAuth } from './auth';

export function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const { status, refreshUser } = useAuth();
  const t = it.auth.verify;

  // A query (not an effect + mutation) so React StrictMode does not consume the one-time token twice.
  const verification = useQuery({
    queryKey: ['verify-email', token],
    queryFn: async () => {
      await api.auth.verifyEmail({ token });
      return true;
    },
    enabled: token.length > 0,
    retry: false,
    staleTime: Infinity,
    gcTime: 0,
  });

  const verified = verification.isSuccess;
  useEffect(() => {
    if (verified && status === 'authenticated') void refreshUser();
  }, [verified, status, refreshUser]);

  return (
    <AuthCard title={t.title}>
      {token.length === 0 && <Alert tone="danger">{t.missingToken}</Alert>}
      {token.length > 0 && verification.isPending && (
        <p role="status" className="flex items-center gap-3 text-sm text-muted">
          <Spinner className="h-5 w-5" />
          {t.checking}
        </p>
      )}
      {verification.isSuccess && <Alert tone="success">{t.success}</Alert>}
      {verification.isError && (
        <div className="space-y-3">
          <Alert tone="danger" title={t.failure} />
          <ApiErrorAlert error={verification.error} />
        </div>
      )}
      {(verification.isSuccess || verification.isError || token.length === 0) && (
        <ButtonLink to={status === 'authenticated' ? '/app' : '/accedi'} className="w-full">
          {status === 'authenticated' ? t.toApp : t.toLogin}
        </ButtonLink>
      )}
    </AuthCard>
  );
}
