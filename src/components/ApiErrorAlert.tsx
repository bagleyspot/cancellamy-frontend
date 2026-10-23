import { describeError, isEmailNotVerified } from '@/lib/errors';
import { Alert } from '@/components/ui/Alert';
import { ResendVerificationButton } from './ResendVerification';

/** Shows API failures; EMAIL_NOT_VERIFIED gets a friendly message with a "resend email" button. */
export function ApiErrorAlert({ error, className }: { error: unknown; className?: string }) {
  if (error === null || error === undefined) return null;
  return (
    <Alert tone="danger" className={className} actions={isEmailNotVerified(error) ? <ResendVerificationButton /> : undefined}>
      {describeError(error).map((line) => (
        <p key={line}>{line}</p>
      ))}
    </Alert>
  );
}
