import { it } from '@/i18n/it';
import { Alert } from '@/components/ui/Alert';
import { ResendVerificationButton } from '@/components/ResendVerification';
import { useAuth } from '@/features/auth/auth';

export function EmailVerifyBanner() {
  const { user } = useAuth();
  if (!user || user.emailVerified) return null;
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-4">
      <Alert tone="warning" title={it.banner.verifyEmailTitle} actions={<ResendVerificationButton />}>
        <p>{it.banner.verifyEmailBody}</p>
      </Alert>
    </div>
  );
}
