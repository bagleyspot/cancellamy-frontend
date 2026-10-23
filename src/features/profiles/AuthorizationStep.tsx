import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthorizationText } from '@/api/queries';
import { useSignAuthorization } from '@/api/mutations';
import type { ProfileDto } from '@/api/types';
import { it } from '@/i18n/it';
import { ApiErrorAlert } from '@/components/ApiErrorAlert';
import { Button } from '@/components/ui/Button';
import { CheckboxField, TextField } from '@/components/ui/Field';
import { QueryBoundary } from '@/components/ui/QueryBoundary';
import { buildSignatureSchema, expectedSignature } from './schemas';
import type { SignatureFormValues } from './schemas';

interface AuthorizationStepProps {
  profile: ProfileDto;
  onSigned: () => void;
}

/** Wizard step 3: shows the delega text and collects the typed signature (must match the profile name). */
export function AuthorizationStep({ profile, onSigned }: AuthorizationStepProps) {
  const t = it.profiles.auth;
  const text = useAuthorizationText(profile.id);
  const sign = useSignAuthorization(profile.id);
  const schema = useMemo(() => buildSignatureSchema(profile), [profile]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignatureFormValues>({ resolver: zodResolver(schema), defaultValues: { signatureName: '', accepted: false } });

  const onSubmit = handleSubmit((values) => {
    sign.mutate({ signatureName: values.signatureName.trim(), accepted: true }, { onSuccess: onSigned });
  });

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">{t.title}</h2>
        <p className="text-sm text-muted">{t.intro}</p>
      </div>
      <QueryBoundary query={text} errorMessage={t.loadError}>
        {(data) => (
          <section aria-label={t.title} className="space-y-2">
            <div
              tabIndex={0}
              className="max-h-72 overflow-y-auto whitespace-pre-wrap rounded-xl border border-line bg-sunken p-4 text-sm leading-relaxed"
            >
              {data.text}
            </div>
            <p className="text-xs text-muted">{t.version(data.version)}</p>
          </section>
        )}
      </QueryBoundary>
      <form onSubmit={(event) => void onSubmit(event)} noValidate className="space-y-4">
        <TextField
          label={t.signatureLabel}
          autoComplete="off"
          hint={t.signatureHint(expectedSignature(profile))}
          error={errors.signatureName?.message}
          {...register('signatureName')}
        />
        <CheckboxField label={t.accept} error={errors.accepted?.message} {...register('accepted')} />
        <p className="text-xs text-muted">{t.pdfNote}</p>
        <ApiErrorAlert error={sign.isError ? sign.error : null} />
        <Button type="submit" loading={sign.isPending} disabled={text.isPending || text.isError}>
          {t.submit}
        </Button>
      </form>
    </div>
  );
}
