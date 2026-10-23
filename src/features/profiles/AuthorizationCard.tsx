import { useState } from 'react';
import type { ProfileDto } from '@/api/types';
import { useRevokeAuthorization } from '@/api/mutations';
import { it } from '@/i18n/it';
import { formatDate } from '@/lib/format';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardTitle } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { AuthorizationPdfActions } from './AuthorizationPdfActions';

export function AuthorizationCard({ profile }: { profile: ProfileDto }) {
  const t = it.profiles.auth;
  const revoke = useRevokeAuthorization(profile.id);
  const [confirming, setConfirming] = useState(false);
  const authorization = profile.authorization;
  const active = authorization !== null && authorization.revokedAt === null;

  return (
    <Card className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <CardTitle>{it.profiles.page.authTitle}</CardTitle>
        {active ? <Badge tone="success">{t.signedOn(formatDate(authorization.signedAt), authorization.signatureName)}</Badge> : <Badge>{t.notSigned}</Badge>}
      </div>
      {authorization?.revokedAt && <p className="text-sm text-muted">{t.revoked(formatDate(authorization.revokedAt))}</p>}
      {active && (
        <>
          <p className="text-xs text-muted">{t.version(authorization.textVersion)}</p>
          <AuthorizationPdfActions profileId={profile.id} />
          <div className="border-t border-line pt-3">
            <Button variant="danger" size="sm" onClick={() => setConfirming(true)}>
              {t.revoke}
            </Button>
          </div>
        </>
      )}
      <ConfirmDialog
        open={confirming}
        title={t.revokeTitle}
        description={t.revokeBody}
        confirmLabel={t.revokeConfirm}
        danger
        pending={revoke.isPending}
        error={revoke.isError ? revoke.error : undefined}
        onClose={() => setConfirming(false)}
        onConfirm={() => revoke.mutate(undefined, { onSuccess: () => setConfirming(false) })}
      />
    </Card>
  );
}
