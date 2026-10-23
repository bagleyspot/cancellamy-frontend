import { useState } from 'react';
import type { FormEvent } from 'react';
import { useSaveFindings } from '@/api/mutations';
import { useFeatures } from '@/api/queries';
import type { DataCategory, RequestDetail } from '@/api/types';
import { it } from '@/i18n/it';
import { DATA_CATEGORY_OPTIONS } from '@/lib/enums';
import { formatDateTime } from '@/lib/format';
import { ApiErrorAlert } from '@/components/ApiErrorAlert';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CheckboxField, TextAreaField } from '@/components/ui/Field';

type Answer = 'yes' | 'no' | '';

function RecordedFindings({ detail }: { detail: RequestDetail }) {
  const t = it.findings;
  const findings = detail.findings;
  if (!findings) return null;
  return (
    <div className="space-y-2 rounded-xl border border-line bg-sunken p-3">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-semibold">{t.recordedTitle}</h3>
        <Badge tone={findings.found ? 'warning' : 'success'}>{findings.found ? t.foundYes : t.foundNo}</Badge>
        <span className="ml-auto text-xs text-muted">{t.recordedOn(formatDateTime(findings.recordedAt))}</span>
      </div>
      {findings.categories.length > 0 && (
        <ul aria-label={t.categories} className="flex flex-wrap gap-1.5">
          {findings.categories.map((category) => (
            <li key={category} className="rounded-full bg-surface px-2.5 py-0.5 text-xs">
              {it.dataCategories[category]}
            </li>
          ))}
        </ul>
      )}
      {findings.note && <p className="whitespace-pre-wrap text-sm">{findings.note}</p>}
    </div>
  );
}

/** For kind 'access' requests: records what the broker answered (found yes/no, categories, note). */
export function AccessFindingsCard({ detail }: { detail: RequestDetail }) {
  const t = it.findings;
  const { features } = useFeatures();
  const save = useSaveFindings(detail.id, detail.profileId);
  const recorded = detail.findings;
  const [answer, setAnswer] = useState<Answer>(recorded ? (recorded.found ? 'yes' : 'no') : '');
  const [categories, setCategories] = useState<ReadonlySet<DataCategory>>(new Set(recorded?.categories ?? []));
  const [note, setNote] = useState(recorded?.note ?? '');
  const [answerError, setAnswerError] = useState<string | undefined>();
  const [saved, setSaved] = useState(false);

  const toggle = (category: DataCategory, checked: boolean) => {
    const next = new Set(categories);
    if (checked) next.add(category);
    else next.delete(category);
    setCategories(next);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (answer === '') {
      setAnswerError(t.choose);
      return;
    }
    setAnswerError(undefined);
    setSaved(false);
    const found = answer === 'yes';
    const trimmed = note.trim();
    save.mutate(
      {
        found,
        categories: found ? DATA_CATEGORY_OPTIONS.filter((option) => categories.has(option)) : [],
        ...(trimmed && { note: trimmed }),
      },
      { onSuccess: () => setSaved(true) },
    );
  };

  return (
    <Card className="space-y-4" aria-labelledby="findings-title">
      <h2 id="findings-title" className="text-lg font-semibold">
        {t.title}
      </h2>
      <RecordedFindings detail={detail} />
      {features.accessRequests && (
        <form onSubmit={submit} noValidate className="space-y-4" aria-label={t.title}>
          <p className="text-sm text-muted">{t.body}</p>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">{t.question}</legend>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {(['yes', 'no'] as const).map((value) => (
                <label key={value} className="flex min-h-9 items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name={`found-${detail.id}`}
                    value={value}
                    checked={answer === value}
                    onChange={() => {
                      setAnswer(value);
                      setAnswerError(undefined);
                    }}
                    className="h-5 w-5 accent-primary"
                  />
                  {value === 'yes' ? t.yes : t.no}
                </label>
              ))}
            </div>
            {answerError && (
              <p role="alert" className="text-sm font-medium text-danger">
                {answerError}
              </p>
            )}
          </fieldset>
          {answer === 'yes' && (
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">{t.categories}</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {DATA_CATEGORY_OPTIONS.map((category) => (
                  <CheckboxField
                    key={category}
                    label={it.dataCategories[category]}
                    checked={categories.has(category)}
                    onChange={(event) => toggle(category, event.target.checked)}
                  />
                ))}
              </div>
            </fieldset>
          )}
          <TextAreaField label={`${t.note} ${it.common.optional}`} hint={t.noteHint} rows={3} value={note} onChange={(event) => setNote(event.target.value)} />
          <ApiErrorAlert error={save.isError ? save.error : null} />
          {saved && <Alert tone="success">{t.saved}</Alert>}
          <Button type="submit" loading={save.isPending}>
            {recorded ? t.update : t.submit}
          </Button>
        </form>
      )}
    </Card>
  );
}
