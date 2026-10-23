import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateDelisting } from '@/api/mutations';
import type { DelistingDto, DelistingReason, ProfileDto, SearchEngine } from '@/api/types';
import { it } from '@/i18n/it';
import { DELISTING_REASON_OPTIONS, SEARCH_ENGINE_OPTIONS } from '@/lib/enums';
import { ApiErrorAlert } from '@/components/ApiErrorAlert';
import { Button } from '@/components/ui/Button';
import { Card, CardTitle } from '@/components/ui/Card';
import { SelectField, TextAreaField, TextField } from '@/components/ui/Field';

const t = it.delisting.form;
const v = it.validation;

const schema = z.object({
  engine: z.enum(SEARCH_ENGINE_OPTIONS as [SearchEngine, ...SearchEngine[]]),
  url: z
    .string()
    .trim()
    .min(1, v.required)
    .max(2000, v.maxLength(2000))
    .refine((value) => /^https?:\/\/\S+$/i.test(value), t.urlInvalid),
  searchQuery: z.string().trim().max(200, v.maxLength(200)),
  reason: z.enum(DELISTING_REASON_OPTIONS as [DelistingReason, ...DelistingReason[]]),
  explanation: z.string().trim().max(2000, v.maxLength(2000)),
});
type FormValues = z.infer<typeof schema>;

interface DelistingFormProps {
  profile: ProfileDto;
  onCreated: (delisting: DelistingDto) => void;
  onCancel: () => void;
}

export function DelistingForm({ profile, onCreated, onCancel }: DelistingFormProps) {
  const create = useCreateDelisting();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { engine: 'google', url: '', searchQuery: `${profile.firstName} ${profile.lastName}`, reason: 'outdated', explanation: '' },
  });

  const onSubmit = handleSubmit((values) => {
    create.mutate(
      {
        profileId: profile.id,
        engine: values.engine,
        url: values.url,
        reason: values.reason,
        ...(values.searchQuery && { searchQuery: values.searchQuery }),
        ...(values.explanation && { explanation: values.explanation }),
      },
      { onSuccess: onCreated },
    );
  });

  return (
    <Card className="space-y-4" aria-labelledby="delisting-form-title">
      <CardTitle id="delisting-form-title">{t.title}</CardTitle>
      <form onSubmit={(event) => void onSubmit(event)} noValidate className="space-y-4">
        <p className="text-sm">
          <span className="font-medium">{t.profile}: </span>
          {profile.firstName} {profile.lastName}
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label={t.engine} error={errors.engine?.message} {...register('engine')}>
            {SEARCH_ENGINE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {it.delisting.engine[option]}
              </option>
            ))}
          </SelectField>
          <SelectField label={t.reason} error={errors.reason?.message} {...register('reason')}>
            {DELISTING_REASON_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {it.delisting.reason[option]}
              </option>
            ))}
          </SelectField>
        </div>
        <TextField label={t.url} hint={t.urlHint} type="url" inputMode="url" error={errors.url?.message} {...register('url')} />
        <TextField label={`${t.query} ${it.common.optional}`} hint={t.queryHint} error={errors.searchQuery?.message} {...register('searchQuery')} />
        <TextAreaField label={`${t.explanation} ${it.common.optional}`} hint={t.explanationHint} error={errors.explanation?.message} {...register('explanation')} />
        <ApiErrorAlert error={create.isError ? create.error : null} />
        <div className="flex flex-wrap gap-2">
          <Button type="submit" loading={create.isPending}>
            {t.submit}
          </Button>
          <Button variant="ghost" onClick={onCancel}>
            {it.common.cancel}
          </Button>
        </div>
      </form>
    </Card>
  );
}
