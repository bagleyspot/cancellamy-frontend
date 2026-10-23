import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useConfig } from '@/api/queries';
import { useCreateCustomRequest } from '@/api/mutations';
import { it } from '@/i18n/it';
import { ApiErrorAlert } from '@/components/ApiErrorAlert';
import { Alert } from '@/components/ui/Alert';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { TextAreaField, TextField } from '@/components/ui/Field';
import { PageHeader } from '@/components/ui/PageHeader';
import { NoProfile } from '@/features/profiles/NoProfile';
import { useSelectedProfile } from '@/features/shell/ProfileContext';

const v = it.validation;

const optionalUrl = z
  .string()
  .trim()
  .refine((value) => value === '' || /^https?:\/\/\S+\.\S+$/i.test(value), v.website);

const schema = z.object({
  name: z.string().trim().min(1, v.required).max(200, v.maxLength(200)),
  website: optionalUrl,
  contactEmail: z
    .string()
    .trim()
    .refine((value) => value === '' || z.email().safeParse(value).success, v.email),
  notes: z.string().trim().max(2000, v.maxLength(2000)),
});
type Form = z.infer<typeof schema>;

export function CustomRequestPage() {
  const t = it.requests.customForm;
  const { selected } = useSelectedProfile();
  const { data: config } = useConfig();
  const create = useCreateCustomRequest();
  const [createdId, setCreatedId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Form>({ resolver: zodResolver(schema), defaultValues: { name: '', website: '', contactEmail: '', notes: '' } });

  if (!selected) return <NoProfile description={t.noProfile} />;

  const onSubmit = handleSubmit((values) => {
    create.mutate(
      {
        profileId: selected.id,
        name: values.name,
        ...(values.website && { website: values.website }),
        ...(values.contactEmail && { contactEmail: values.contactEmail }),
        ...(values.notes && { notes: values.notes }),
      },
      {
        onSuccess: (created) => {
          setCreatedId(created.id);
          reset();
        },
      },
    );
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title={t.title} description={t.intro} />
      {createdId && (
        <Alert tone="success" title={t.success} actions={<ButtonLink to={`/app/richieste/${createdId}`} size="sm" variant="secondary">{t.viewRequest}</ButtonLink>} />
      )}
      <Card>
        <form onSubmit={(event) => void onSubmit(event)} noValidate className="space-y-4">
          <p className="text-sm">
            <span className="font-medium">{t.profile}: </span>
            {selected.firstName} {selected.lastName}
          </p>
          <TextField label={t.name} error={errors.name?.message} {...register('name')} />
          <TextField label={`${t.website} ${it.common.optional}`} type="url" inputMode="url" error={errors.website?.message} {...register('website')} />
          <TextField
            label={`${t.contactEmail} ${it.common.optional}`}
            type="email"
            hint={t.contactEmailHint}
            error={errors.contactEmail?.message}
            {...register('contactEmail')}
          />
          <TextAreaField label={`${t.notes} ${it.common.optional}`} hint={t.notesHint} error={errors.notes?.message} {...register('notes')} />
          {config && <p className="text-xs text-muted">{t.limit(config.customRequestsPerMonth)}</p>}
          <ApiErrorAlert error={create.isError ? create.error : null} />
          <Button type="submit" loading={create.isPending}>
            {t.submit}
          </Button>
        </form>
      </Card>
    </div>
  );
}
