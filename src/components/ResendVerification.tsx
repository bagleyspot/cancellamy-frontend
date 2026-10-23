import { useMutation } from '@tanstack/react-query';
import { MailCheck } from 'lucide-react';
import { api } from '@/api/endpoints';
import { it } from '@/i18n/it';
import { describeError } from '@/lib/errors';
import { Button } from '@/components/ui/Button';

export function ResendVerificationButton({ variant = 'secondary' }: { variant?: 'secondary' | 'primary' }) {
  const mutation = useMutation({ mutationFn: api.auth.resendVerification });
  return (
    <div className="space-y-2">
      <Button variant={variant} size="sm" onClick={() => mutation.mutate()} loading={mutation.isPending}>
        <MailCheck className="h-4 w-4" aria-hidden="true" />
        {mutation.isPending ? it.banner.resending : it.banner.resend}
      </Button>
      {mutation.isSuccess && (
        <p role="status" className="text-sm font-medium text-success">
          {it.banner.resent}
        </p>
      )}
      {mutation.isError && (
        <p role="alert" className="text-sm font-medium text-danger">
          {describeError(mutation.error)[0]}
        </p>
      )}
    </div>
  );
}
