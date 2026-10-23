import { useEffect, useState } from 'react';
import { ArrowLeft, Eye, Pause, Pencil, Play, Trash2 } from 'lucide-react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { useFeatures, useProfile } from '@/api/queries';
import { useDeleteProfile, usePauseResumeProfile } from '@/api/mutations';
import type { ActivateProfileResponse, ProfileDto } from '@/api/types';
import { it } from '@/i18n/it';
import { formatDate } from '@/lib/format';
import { ApiErrorAlert } from '@/components/ApiErrorAlert';
import { Alert } from '@/components/ui/Alert';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Card, CardTitle } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { QueryBoundary } from '@/components/ui/QueryBoundary';
import { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton';
import { ActivationStep } from './ActivationStep';
import { AuthorizationCard } from './AuthorizationCard';
import { AuthorizationStep } from './AuthorizationStep';
import { BreachesCard } from './BreachesCard';
import { IdentityCard } from './IdentityCard';
import { ProfileEditForm } from './ProfileEditForm';
import { ProfileStatusBadge } from './ProfileStatusBadge';
import { ProfileSummary } from './ProfileSummary';
import { SenderCard } from './SenderCard';
import { Stepper } from './Stepper';
import { useSelectedProfile } from '@/features/shell/ProfileContext';

interface SetupFlowProps {
  profile: ProfileDto;
  activation: ActivateProfileResponse | null;
  onActivated: (result: ActivateProfileResponse) => void;
}

function SetupFlow({ profile, activation, onActivated }: SetupFlowProps) {
  const t = it.profiles.page;
  // draft = no valid authorization yet (step 3); ready = signed, waiting for activation (step 4).
  const step = profile.status === 'draft' ? 3 : 4;
  return (
    <section aria-label={t.setupTitle} className="space-y-4">
      <Stepper current={step} />
      <Card>
        {step === 3 ? (
          <AuthorizationStep profile={profile} onSigned={() => undefined} />
        ) : (
          <ActivationStep profile={profile} result={activation} onActivated={onActivated} />
        )}
      </Card>
    </section>
  );
}

function ProfileDetail({ profile }: { profile: ProfileDto }) {
  const t = it.profiles.page;
  const navigate = useNavigate();
  const { hash } = useLocation();
  const { features } = useFeatures();
  const { select } = useSelectedProfile();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [activation, setActivation] = useState<ActivateProfileResponse | null>(null);
  const pauseResume = usePauseResumeProfile(profile.id);
  const remove = useDeleteProfile();
  const name = `${profile.firstName} ${profile.lastName}`;
  const counts = profile.requestCounts;
  const setupPending = profile.status === 'draft' || profile.status === 'ready';
  const showSetup = setupPending || activation !== null;

  // In-page links such as /app/profili/:id#identita: React Router does not scroll to hashes by itself.
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView?.({ block: 'start' });
  }, [hash]);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{name}</h1>
          <ProfileStatusBadge status={profile.status} />
        </div>
        <p className="text-sm text-muted">
          {t.createdOn(formatDate(profile.createdAt))}
          {profile.activatedAt ? ` · ${t.activatedOn(formatDate(profile.activatedAt))}` : ''}
        </p>
        {profile.status === 'paused' && <Alert tone="warning">{t.pausedHint}</Alert>}
      </header>

      {showSetup && <SetupFlow profile={profile} activation={activation} onActivated={setActivation} />}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle>{t.dataTitle}</CardTitle>
              {!editing && (
                <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                  {t.editData}
                </Button>
              )}
            </div>
            {editing ? <ProfileEditForm profile={profile} onDone={() => setEditing(false)} /> : <ProfileSummary profile={profile} />}
          </Card>
          <IdentityCard profile={profile} />
          {features.breachCheck && <BreachesCard profile={profile} />}
          {features.senderSmtp && <SenderCard profile={profile} />}
        </div>

        <div className="space-y-6">
          <AuthorizationCard profile={profile} />
          {!setupPending && (
            <Card className="space-y-3">
              <CardTitle>{t.requestsTitle}</CardTitle>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-muted">{it.profiles.counts.total}</dt>
                  <dd className="text-xl font-semibold tabular-nums">{counts.total}</dd>
                </div>
                <div>
                  <dt className="text-muted">{it.profiles.counts.inProgress}</dt>
                  <dd className="text-xl font-semibold tabular-nums">{counts.inProgress}</dd>
                </div>
                <div>
                  <dt className="text-muted">{it.profiles.counts.actionRequired}</dt>
                  <dd className="text-xl font-semibold tabular-nums">{counts.actionRequired}</dd>
                </div>
                <div>
                  <dt className="text-muted">{it.profiles.counts.completed}</dt>
                  <dd className="text-xl font-semibold tabular-nums">{counts.completed}</dd>
                </div>
              </dl>
              <ButtonLink to="/app/richieste" variant="secondary" size="sm">
                {t.seeRequests}
              </ButtonLink>
            </Card>
          )}
          {features.accessRequests && !setupPending && (
            <Card className="space-y-3">
              <CardTitle>{it.access.title}</CardTitle>
              <p className="text-sm text-muted">{t.accessBody}</p>
              <ButtonLink to="/app/accesso" variant="secondary" size="sm" onClick={() => select(profile.id)}>
                <Eye className="h-4 w-4" aria-hidden="true" />
                {t.accessLink}
              </ButtonLink>
            </Card>
          )}
          {(profile.status === 'active' || profile.status === 'paused') && (
            <Card className="space-y-3">
              <Button
                variant="secondary"
                onClick={() => pauseResume.mutate(profile.status === 'active' ? 'pause' : 'resume')}
                loading={pauseResume.isPending}
              >
                {profile.status === 'active' ? <Pause className="h-4 w-4" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}
                {profile.status === 'active' ? t.pause : t.resume}
              </Button>
              <ApiErrorAlert error={pauseResume.isError ? pauseResume.error : null} />
            </Card>
          )}
          <Card className="space-y-3">
            <CardTitle>{t.dangerTitle}</CardTitle>
            <p className="text-sm text-muted">{t.dangerBody}</p>
            <Button variant="danger" size="sm" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              {t.delete}
            </Button>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title={t.deleteTitle}
        description={t.deleteBody(name)}
        confirmLabel={t.deleteConfirm}
        danger
        pending={remove.isPending}
        error={remove.isError ? remove.error : undefined}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => remove.mutate(profile.id, { onSuccess: () => void navigate('/app/profili', { replace: true }) })}
      />
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <SkeletonGroup label={it.common.loading} className="space-y-4">
      <Skeleton className="h-10 w-1/2" />
      <Skeleton className="h-64 w-full" />
    </SkeletonGroup>
  );
}

export function ProfilePage() {
  const { id = '' } = useParams();
  const query = useProfile(id);
  return (
    <div className="space-y-6">
      <Link to="/app/profili" className="inline-flex items-center gap-1 text-sm font-medium text-primary underline underline-offset-2">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {it.profiles.page.back}
      </Link>
      <QueryBoundary query={query} skeleton={<ProfileSkeleton />} errorMessage={it.profiles.page.loadError}>
        {(profile) => <ProfileDetail profile={profile} />}
      </QueryBoundary>
    </div>
  );
}
