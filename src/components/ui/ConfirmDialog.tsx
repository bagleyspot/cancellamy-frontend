import { useState } from 'react';
import type { ReactNode } from 'react';
import { it } from '@/i18n/it';
import { Alert } from './Alert';
import { Button } from './Button';
import { Dialog } from './Dialog';
import { TextField } from './Field';
import { describeError } from '@/lib/errors';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
  pending?: boolean;
  error?: unknown;
  danger?: boolean;
  /** When set, the user must type this word to enable the confirm button. */
  requireText?: string;
  children?: ReactNode;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  onConfirm,
  onClose,
  pending = false,
  error,
  danger = false,
  requireText,
  children,
}: ConfirmDialogProps) {
  const [typed, setTyped] = useState('');
  const blocked = requireText !== undefined && typed.trim() !== requireText;

  const close = () => {
    setTyped('');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={close}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={pending}>
            {it.common.cancel}
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={pending} disabled={blocked}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {children}
        {requireText !== undefined && (
          <TextField
            label={it.validation.deleteConfirm}
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
            autoComplete="off"
          />
        )}
        {error !== undefined && error !== null && (
          <Alert tone="danger">
            {describeError(error).map((line) => (
              <p key={line}>{line}</p>
            ))}
          </Alert>
        )}
      </div>
    </Dialog>
  );
}
