import { it } from '@/i18n/it';
import { formatDate } from '@/lib/format';
import type { ProfileDto } from '@/api/types';

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</dt>
      <dd className="break-words text-sm">{children}</dd>
    </div>
  );
}

function List({ items }: { items: string[] }) {
  if (items.length === 0) return <>{it.profiles.summary.noValue}</>;
  return (
    <ul className="space-y-0.5">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export function ProfileSummary({ profile }: { profile: ProfileDto }) {
  const t = it.profiles.fields;
  const none = it.profiles.summary.noValue;
  return (
    <dl className="grid gap-4 sm:grid-cols-2">
      <Row label={`${t.firstName} / ${t.lastName}`}>
        {profile.firstName} {profile.lastName}
      </Row>
      <Row label={t.dateOfBirth}>{profile.dateOfBirth ? formatDate(profile.dateOfBirth) : none}</Row>
      <Row label={t.fiscalCode}>{profile.fiscalCode ?? none}</Row>
      <Row label={t.aliases}>
        <List items={profile.aliases} />
      </Row>
      <Row label={t.emails}>
        <List items={profile.emails} />
      </Row>
      <Row label={t.phones}>
        <List items={profile.phones} />
      </Row>
      <div className="sm:col-span-2">
        <Row label={t.addresses}>
          <List
            items={profile.addresses.map((a) => [a.street, [a.zip, a.city, a.province].filter(Boolean).join(' '), a.country].join(', '))}
          />
        </Row>
      </div>
    </dl>
  );
}
