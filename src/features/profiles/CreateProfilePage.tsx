import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router';
import { useCreateProfile } from '@/api/mutations';
import { useProfiles } from '@/api/queries';
import { it } from '@/i18n/it';
import { ApiErrorAlert } from '@/components/ApiErrorAlert';
import { Alert } from '@/components/ui/Alert';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { useCurrentUser } from '@/features/auth/auth';
import { ContactFields, PersonalFields } from './ProfileFields';
import { Stepper } from './Stepper';
import { STEP_FIELDS, emptyProfileForm, profileFormSchema, toProfileInput } from './schemas';
import type { ProfileFormValues } from './schemas';

/** Wizard steps 1 and 2. The profile is created at the end of step 2; steps 3 and 4 continue on the profile page. */
export function CreateProfilePage() {
  const t = it.profiles;
  const navigate = useNavigate();
  const user = useCurrentUser();
  const profiles = useProfiles();
  const create = useCreateProfile();
  const [step, setStep] = useState<1 | 2>(1);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: emptyProfileForm(),
    mode: 'onTouched',
  });

  const limitReached = (profiles.data?.length ?? 0) >= user.maxProfiles;

  const goNext = async () => {
    if (await form.trigger([...STEP_FIELDS[1]])) setStep(2);
  };

  const onSubmit = form.handleSubmit((values) => {
    create.mutate(toProfileInput(values), {
      onSuccess: (profile) => void navigate(`/app/profili/${profile.id}`, { replace: true }),
    });
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title={t.newTitle} description={t.newSubtitle} />
      {limitReached ? (
        <Alert tone="warning" title={t.limitReached} actions={<ButtonLink to="/app/profili" size="sm" variant="secondary">{t.title}</ButtonLink>} />
      ) : (
        <>
          <Stepper current={step} />
          <Card>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (step === 1) void goNext();
                else void onSubmit(event);
              }}
              noValidate
              className="space-y-6"
            >
              <div className="space-y-1">
                <h2 className="text-xl font-semibold">{t.steps[step - 1]}</h2>
                <p className="text-sm text-muted">{t.stepOf(step, t.steps.length)}</p>
              </div>
              <div hidden={step !== 1}>
                <PersonalFields form={form} />
              </div>
              <div hidden={step !== 2}>
                <ContactFields form={form} />
              </div>
              <ApiErrorAlert error={create.isError ? create.error : null} />
              <div className="flex flex-wrap justify-between gap-3">
                {step === 1 ? (
                  <ButtonLink to="/app/profili" variant="ghost">
                    {it.common.cancel}
                  </ButtonLink>
                ) : (
                  <Button variant="secondary" onClick={() => setStep(1)}>
                    {it.common.back}
                  </Button>
                )}
                {step === 1 ? (
                  <Button onClick={() => void goNext()}>{it.common.next}</Button>
                ) : (
                  <Button type="submit" loading={create.isPending}>
                    {it.common.next}
                  </Button>
                )}
              </div>
            </form>
          </Card>
        </>
      )}
    </div>
  );
}
