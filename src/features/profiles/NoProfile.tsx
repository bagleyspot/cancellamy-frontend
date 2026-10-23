import { UserPlus } from 'lucide-react';
import { it } from '@/i18n/it';
import { ButtonLink } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';

export function NoProfile({ description }: { description?: string }) {
  return (
    <EmptyState
      icon={UserPlus}
      title={it.shell.noProfileTitle}
      description={description ?? it.shell.noProfileBody}
      action={<ButtonLink to="/app/profili/nuovo">{it.shell.noProfileCta}</ButtonLink>}
    />
  );
}
