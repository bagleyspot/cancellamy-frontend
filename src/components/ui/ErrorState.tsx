import { RefreshCw } from 'lucide-react';
import { it } from '@/i18n/it';
import { describeError } from '@/lib/errors';
import { Alert } from './Alert';
import { Button } from './Button';

interface ErrorStateProps {
  error?: unknown;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ error, message, onRetry }: ErrorStateProps) {
  const details = error === undefined ? [] : describeError(error);
  return (
    <Alert
      tone="danger"
      title={message ?? it.common.loadError}
      actions={
        onRetry && (
          <Button variant="secondary" size="sm" onClick={onRetry}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            {it.common.retry}
          </Button>
        )
      }
    >
      {details.map((line) => (
        <p key={line}>{line}</p>
      ))}
    </Alert>
  );
}
