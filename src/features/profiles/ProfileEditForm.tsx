import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useUpdateProfile } from '@/api/mutations';
import type { ProfileDto } from '@/api/types';
import { it } from '@/i18n/it';
import { ApiErrorAlert } from '@/components/ApiErrorAlert';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { ContactFields, PersonalFields } from './ProfileFields';
import { profileFormSchema, toFormValues, toProfileInput } from './schemas';
import type { ProfileFormValues } from './schemas';

interface ProfileEditFormProps {
  profile: ProfileDto;
  onDone: () => void;
}

export function ProfileEditForm({ profile, onDone }: ProfileEditFormProps) {
  const t = it.profiles.page;
  const update = useUpdateProfile(profile.id);
  const [saved, setSaved] = useState(false);
  const form = useForm<ProfileFormValues>({ resolver: zodResolver(profileFormSchema), defaultValues: toFormValues(profile) });

  const onSubmit = form.handleSubmit((values) => {
    setSaved(false);
    update.mutate(toProfileInput(values), {
      onSuccess: () => {
        setSaved(true);
        onDone();
      },
    });
  });

  return (
    <form onSubmit={(event) => void onSubmit(event)} noValidate className="space-y-6">
      <Alert tone="info">{t.editHint}</Alert>
      <PersonalFields form={form} />
      <ContactFields form={form} />
      <ApiErrorAlert error={update.isError ? update.error : null} />
      {saved && <Alert tone="success">{t.saved}</Alert>}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" loading={update.isPending}>
          {it.common.save}
        </Button>
        <Button variant="secondary" onClick={onDone} disabled={update.isPending}>
          {it.common.cancel}
        </Button>
      </div>
    </form>
  );
}
