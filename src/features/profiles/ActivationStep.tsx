import { useActivateProfile } from '@/api/mutations';
import type { ActivateProfileResponse, ProfileDto } from '@/api/types';
import { CheckCircle2, Rocket } from 'lucide-react';
import { it } from '@/i18n/it';
import { formatDate } from '@/lib/format';
import { ApiErrorAlert } from '@/components/ApiErrorAlert';
import { Alert } from '@/components/ui/Alert';
import { Button, ButtonLink } from '@/components/ui/Button';
import { AuthorizationPdfActions } from './AuthorizationPdfActions';
import { ProfileSummary } from './ProfileSummary';

interface ActivationStepProps {
  profile: ProfileDto;
  /** Kept by the parent: once activated the profile status changes and this step would otherwise unmount. */
  result: ActivateProfileResponse | null;
  onActivated: (result: ActivateProfileResponse) => void;
}

/** Wizard step 4: summary of the data and activation; shows how many requests were queued. */
export function ActivationStep({ profile, result, onActivated }: ActivationStepProps) {
  const t = it.profiles.summary;
  const activate = useActivateProfile(profile.id);

  if (result) {
    return (
      <div className="space-y-4">
        <Alert tone="success" title={t.doneTitle}>
          <p className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {t.doneEmails(result.emailRequests)}
          </p>
          <p>{t.doneManual(result.manualActions)}</p>
        </Alert>
        <div className="flex flex-wrap gap-3">
          {result.manualActions > 0 && <ButtonLink to="/app/richieste?group=action_required">{t.goToActions}</ButtonLink>}
          <ButtonLink to="/app/richieste" variant={result.manualActions > 0 ? 'secondary' : 'primary'}>
            {t.goToRequests}
          </ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">{t.title}</h2>
        <p className="text-sm text-muted">{t.intro}</p>
      </div>
      <section className="space-y-3 rounded-xl border border-line p-4">
        <h3 className="text-sm font-semibold">{t.dataTitle}</h3>
        <ProfileSummary profile={profile} />
      </section>
      {profile.authorization && (
        <section className="space-y-2 rounded-xl border border-line p-4">
          <h3 className="text-sm font-semibold">{it.profiles.auth.title}</h3>
          <p className="text-sm text-muted">
            {it.profiles.auth.signedOn(formatDate(profile.authorization.signedAt), profile.authorization.signatureName)}
          </p>
          <AuthorizationPdfActions profileId={profile.id} />
        </section>
      )}
      <ApiErrorAlert error={activate.isError ? activate.error : null} />
      <Button onClick={() => activate.mutate(undefined, { onSuccess: onActivated })} loading={activate.isPending}>
        <Rocket className="h-4 w-4" aria-hidden="true" />
        {activate.isPending ? t.activating : t.activate}
      </Button>
    </div>
  );
}
