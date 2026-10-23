import { useState } from 'react';
import type { FormEvent } from 'react';
import { BadgeCheck, ShieldCheck } from 'lucide-react';
import { useIdentityActions } from '@/api/mutations';
import { useIdentity } from '@/api/queries';
import type { IdentityContactDto, ProfileDto } from '@/api/types';
import { it } from '@/i18n/it';
import { formatDate } from '@/lib/format';
import { ApiErrorAlert } from '@/components/ApiErrorAlert';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardTitle } from '@/components/ui/Card';
import { TextField } from '@/components/ui/Field';
import { QueryBoundary } from '@/components/ui/QueryBoundary';
import { Skeleton } from '@/components/ui/Skeleton';

const t = it.identity;
const CODE_PATTERN = /^\d{6}$/;

function ContactRow({ profileId, contact }: { profileId: string; contact: IdentityContactDto }) {
  const actions = useIdentityActions(profileId);
  const [entering, setEntering] = useState(false);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState<string | undefined>();
  const target = { type: contact.type, value: contact.value } as const;

  const send = () => {
    setCode('');
    setCodeError(undefined);
    actions.confirm.reset();
    actions.sendCode.mutate(target, { onSuccess: () => setEntering(true) });
  };

  const confirm = (event: FormEvent) => {
    event.preventDefault();
    if (!CODE_PATTERN.test(code.trim())) {
      setCodeError(t.codeInvalidFormat);
      return;
    }
    setCodeError(undefined);
    actions.confirm.mutate({ ...target, code: code.trim() }, { onSuccess: () => setEntering(false) });
  };

  return (
    <li className="space-y-3 rounded-xl border border-line p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="break-all text-sm font-medium">{contact.value}</p>
          <p className="text-xs text-muted">{t.type[contact.type]}</p>
        </div>
        {contact.verified ? (
          <Badge tone="success">
            <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
            {t.verified}
            {contact.verifiedAt && <span className="sr-only"> ({t.verifiedOn(formatDate(contact.verifiedAt))})</span>}
          </Badge>
        ) : (
          <div className="flex items-center gap-2">
            <Badge tone="warning">{t.unverified}</Badge>
            {!entering && (
              <Button size="sm" variant="secondary" onClick={send} loading={actions.sendCode.isPending} aria-label={t.verifyFor(contact.value)}>
                {t.verify}
              </Button>
            )}
          </div>
        )}
      </div>

      {!contact.verified && entering && (
        <form onSubmit={confirm} noValidate className="space-y-3">
          <p className="text-sm text-muted" role="status">
            {t.codeSent(contact.value)}
          </p>
          <TextField
            label={t.codeFor(contact.value)}
            value={code}
            onChange={(event) => setCode(event.target.value)}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="123456"
            error={codeError}
            className="max-w-48 tracking-widest"
          />
          <div className="flex flex-wrap gap-2">
            <Button type="submit" size="sm" loading={actions.confirm.isPending}>
              {t.confirm}
            </Button>
            <Button size="sm" variant="ghost" onClick={send} loading={actions.sendCode.isPending}>
              {t.resend}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEntering(false)}>
              {t.cancel}
            </Button>
          </div>
        </form>
      )}

      <ApiErrorAlert error={actions.sendCode.isError ? actions.sendCode.error : actions.confirm.isError ? actions.confirm.error : null} />
    </li>
  );
}

export function IdentityCard({ profile }: { profile: ProfileDto }) {
  const query = useIdentity(profile.id);
  return (
    <Card className="space-y-4" id="identita" aria-labelledby="identita-title">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
          <CardTitle id="identita-title">{t.title}</CardTitle>
        </div>
        {query.data && <Badge tone={query.data.verified ? 'success' : 'warning'}>{query.data.verified ? t.allVerified : t.notVerified}</Badge>}
      </div>
      <p className="text-sm text-muted">{t.intro}</p>
      <QueryBoundary query={query} errorMessage={t.loadError} skeleton={<Skeleton className="h-24 w-full" />}>
        {(identity) => {
          const contacts = identity.contacts.filter((contact) => contact.type === 'email' || identity.requiresPhone);
          return contacts.length === 0 ? (
            <p className="text-sm text-muted">{t.noContacts}</p>
          ) : (
            <>
              <ul className="space-y-3" aria-label={t.title}>
                {contacts.map((contact) => (
                  <ContactRow key={`${contact.type}:${contact.value}`} profileId={profile.id} contact={contact} />
                ))}
              </ul>
              {identity.requiresPhone && <p className="text-xs text-muted">{t.phoneNote}</p>}
            </>
          );
        }}
      </QueryBoundary>
    </Card>
  );
}
