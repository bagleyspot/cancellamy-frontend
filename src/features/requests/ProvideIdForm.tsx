import { useId, useState } from 'react';
import type { FormEvent } from 'react';
import { Upload } from 'lucide-react';
import { it } from '@/i18n/it';
import { formatFileSize } from '@/lib/format';
import { ApiErrorAlert } from '@/components/ApiErrorAlert';
import { Button } from '@/components/ui/Button';
import { TextAreaField } from '@/components/ui/Field';
import { validateIdFile } from './permissions';

interface ProvideIdFormProps {
  onSubmit: (input: { file: File; note?: string }) => void;
  pending: boolean;
  error: unknown;
}

export function ProvideIdForm({ onSubmit, pending, error }: ProvideIdFormProps) {
  const t = it.requests.provideId;
  const fileId = useId();
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState('');
  const [fileError, setFileError] = useState<string | undefined>();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!file) {
      setFileError(it.validation.fileRequired);
      return;
    }
    const problem = validateIdFile(file);
    if (problem) {
      setFileError(problem === 'type' ? it.validation.fileType : it.validation.fileSize);
      return;
    }
    setFileError(undefined);
    const trimmed = note.trim();
    onSubmit(trimmed ? { file, note: trimmed } : { file });
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <h3 className="text-base font-semibold">{t.title}</h3>
      <p className="text-sm text-muted">{t.body}</p>
      <div className="space-y-1.5">
        <label htmlFor={fileId} className="block text-sm font-medium">
          {t.fileLabel}
        </label>
        <input
          id={fileId}
          type="file"
          accept="application/pdf,image/jpeg,image/png"
          aria-invalid={fileError ? true : undefined}
          aria-describedby={fileError ? `${fileId}-error` : undefined}
          onChange={(event) => {
            setFile(event.target.files?.[0] ?? null);
            setFileError(undefined);
          }}
          className="block w-full rounded-xl border border-line bg-surface text-sm file:mr-3 file:min-h-11 file:border-0 file:bg-sunken file:px-4 file:font-medium"
        />
        {file && <p className="text-xs text-muted">{t.selected(file.name, formatFileSize(file.size))}</p>}
        {fileError && (
          <p id={`${fileId}-error`} role="alert" className="text-sm font-medium text-danger">
            {fileError}
          </p>
        )}
      </div>
      <TextAreaField label={`${t.noteLabel} ${it.common.optional}`} rows={3} value={note} onChange={(event) => setNote(event.target.value)} />
      <ApiErrorAlert error={error} />
      <Button type="submit" loading={pending}>
        <Upload className="h-4 w-4" aria-hidden="true" />
        {t.submit}
      </Button>
    </form>
  );
}
