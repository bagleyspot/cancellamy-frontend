import { ChevronRight, Plus } from 'lucide-react';
import { Link } from 'react-router';
import { useProfiles } from '@/api/queries';
import type { ProfileDto } from '@/api/types';
import { it } from '@/i18n/it';
import { Alert } from '@/components/ui/Alert';
import { ButtonLink } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { QueryBoundary } from '@/components/ui/QueryBoundary';
import { useCurrentUser } from '@/features/auth/auth';
import { NoProfile } from './NoProfile';
import { ProfileStatusBadge } from './ProfileStatusBadge';

function ProfileCard({ profile }: { profile: ProfileDto }) {
  const t = it.profiles;
  const name = `${profile.firstName} ${profile.lastName}`;
  const counts = profile.requestCounts;
  return (
    <li>
      <Link
        to={`/app/profili/${profile.id}`}
        aria-label={t.open(name)}
        className="flex items-center gap-4 rounded-xl border border-line bg-surface p-5 shadow-2xs transition-all hover:border-primary/50 hover:shadow-sm"
      >
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-base font-bold tracking-tight text-fg">{name}</span>
            <ProfileStatusBadge status={profile.status} />
          </div>
          <p className="truncate font-mono text-xs text-muted">{profile.emails.join(', ')}</p>
          <dl className="flex flex-wrap gap-x-5 gap-y-1 text-xs">
            <div className="flex gap-1">
              <dt className="text-muted">{t.counts.inProgress}:</dt>
              <dd className="font-mono font-semibold text-fg">{counts.inProgress}</dd>
            </div>
            <div className="flex gap-1">
              <dt className="text-muted">{t.counts.actionRequired}:</dt>
              <dd className="font-mono font-semibold text-fg">{counts.actionRequired}</dd>
            </div>
            <div className="flex gap-1">
              <dt className="text-muted">{t.counts.completed}:</dt>
              <dd className="font-mono font-semibold text-success">{counts.completed}</dd>
            </div>
          </dl>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
      </Link>
    </li>
  );
}

export function ProfilesPage() {
  const t = it.profiles;
  const user = useCurrentUser();
  const query = useProfiles();
  const used = query.data?.length ?? 0;
  const limitReached = used >= user.maxProfiles;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.title}
        description={t.subtitle}
        actions={
          limitReached ? undefined : (
            <ButtonLink to="/app/profili/nuovo">
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t.add}
            </ButtonLink>
          )
        }
      />
      <p className="text-sm text-muted">{t.usage(used, user.maxProfiles)}</p>
      {limitReached && <Alert tone="info">{t.limitReached}</Alert>}
      <QueryBoundary query={query} errorMessage={t.loadError}>
        {(profiles) =>
          profiles.length === 0 ? (
            <NoProfile />
          ) : (
            <ul className="space-y-3">
              {profiles.map((profile) => (
                <ProfileCard key={profile.id} profile={profile} />
              ))}
            </ul>
          )
        }
      </QueryBoundary>
    </div>
  );
}
