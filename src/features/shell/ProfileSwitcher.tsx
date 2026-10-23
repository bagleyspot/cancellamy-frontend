import { it } from '@/i18n/it';
import { useSelectedProfile } from './ProfileContext';

export function ProfileSwitcher() {
  const { profiles, selected, select } = useSelectedProfile();
  if (!selected) return null;
  const label = it.shell.profileSwitcher;

  if (profiles.length < 2) {
    return (
      <p className="truncate rounded-lg border border-line bg-sunken/70 px-2.5 py-1 text-xs font-semibold text-fg" title={label}>
        <span className="sr-only">{label}: </span>
        {selected.firstName} {selected.lastName}
      </p>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="profile-switcher" className="sr-only">
        {label}
      </label>
      <select
        id="profile-switcher"
        value={selected.id}
        onChange={(event) => select(event.target.value)}
        className="min-h-8.5 max-w-48 rounded-lg border border-line bg-surface px-2.5 py-1 text-xs font-semibold text-fg shadow-2xs"
      >
        {profiles.map((profile) => (
          <option key={profile.id} value={profile.id}>
            {profile.firstName} {profile.lastName}
          </option>
        ))}
      </select>
    </div>
  );
}
