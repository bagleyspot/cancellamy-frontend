import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNuisanceActions } from '@/api/mutations';
import type { NuisanceChannel, ProfileDto } from '@/api/types';
import { it } from '@/i18n/it';
import { NUISANCE_CHANNEL_OPTIONS } from '@/lib/enums';
import { ApiErrorAlert } from '@/components/ApiErrorAlert';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card, CardTitle } from '@/components/ui/Card';
import { SelectField, TextAreaField, TextField } from '@/components/ui/Field';

const t = it.nuisance.form;
const v = it.validation;

const schema = z.object({
  channel: z.enum(NUISANCE_CHANNEL_OPTIONS as [NuisanceChannel, ...NuisanceChannel[]]),
  callerNumber: z.string().trim().max(100, v.maxLength(100)),
  company: z.string().trim().max(200, v.maxLength(200)),
  receivedAt: z.string().refine((value) => value !== '' && !Number.isNaN(new Date(value).getTime()), t.receivedAtRequired),
  summary: z.string().trim().max(2000, v.maxLength(2000)),
  consentGiven: z.enum(['no', 'unknown']),
});
type FormValues = z.infer<typeof schema>;

/** Value for an `<input type="datetime-local">` in the user's timezone. */
export function toLocalInputValue(date: Date): string {
  const shifted = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return shifted.toISOString().slice(0, 16);
}

export function ReportForm({ profile }: { profile: ProfileDto }) {
  const { create } = useNuisanceActions(profile.id);
  const [saved, setSaved] = useState(false);
  const defaults = (): FormValues => ({
    channel: 'call',
    callerNumber: '',
    company: '',
    receivedAt: toLocalInputValue(new Date()),
    summary: '',
    consentGiven: 'no',
  });
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: defaults() });

  const onSubmit = handleSubmit((values) => {
    setSaved(false);
    create.mutate(
      {
        profileId: profile.id,
        channel: values.channel,
        receivedAt: new Date(values.receivedAt).toISOString(),
        consentGiven: values.consentGiven,
        ...(values.callerNumber && { callerNumber: values.callerNumber }),
        ...(values.company && { company: values.company }),
        ...(values.summary && { summary: values.summary }),
      },
      {
        onSuccess: () => {
          setSaved(true);
          reset(defaults());
        },
      },
    );
  });

  return (
    <Card className="space-y-4" aria-labelledby="nuisance-form-title">
      <CardTitle id="nuisance-form-title">{t.title}</CardTitle>
      <form onSubmit={(event) => void onSubmit(event)} noValidate className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label={t.channel} error={errors.channel?.message} {...register('channel')}>
            {NUISANCE_CHANNEL_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {it.nuisance.channels[option]}
              </option>
            ))}
          </SelectField>
          <TextField label={t.receivedAt} type="datetime-local" error={errors.receivedAt?.message} {...register('receivedAt')} />
          <TextField label={`${t.callerNumber} ${it.common.optional}`} hint={t.callerNumberHint} error={errors.callerNumber?.message} {...register('callerNumber')} />
          <TextField label={`${t.company} ${it.common.optional}`} error={errors.company?.message} {...register('company')} />
        </div>
        <TextAreaField label={`${t.summary} ${it.common.optional}`} rows={3} error={errors.summary?.message} {...register('summary')} />
        <SelectField label={t.consent} error={errors.consentGiven?.message} {...register('consentGiven')}>
          <option value="no">{it.nuisance.consent.no}</option>
          <option value="unknown">{it.nuisance.consent.unknown}</option>
        </SelectField>
        <ApiErrorAlert error={create.isError ? create.error : null} />
        {saved && <Alert tone="success">{t.saved}</Alert>}
        <Button type="submit" loading={create.isPending}>
          {t.submit}
        </Button>
      </form>
    </Card>
  );
}
