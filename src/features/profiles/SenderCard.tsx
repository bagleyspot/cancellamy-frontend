import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ExternalLink, Mail, Plug, Undo2 } from 'lucide-react';
import { z } from 'zod';
import { isApiError } from '@/api/http';
import { useSenderActions } from '@/api/mutations';
import { useSender } from '@/api/queries';
import type { ProfileDto, SenderDto, SmtpSettingsInput } from '@/api/types';
import { it } from '@/i18n/it';
import { describeError, isFeatureDisabled } from '@/lib/errors';
import { formatDateTime } from '@/lib/format';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardTitle } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { CheckboxField, SelectField, TextField } from '@/components/ui/Field';
import { QueryBoundary } from '@/components/ui/QueryBoundary';
import { Skeleton } from '@/components/ui/Skeleton';
import { detectPreset, SENDER_PRESETS, SENDER_PROVIDER_IDS } from './senderPresets';
import type { SenderPresetId } from './senderPresets';

const t = it.sender;
const v = it.validation;
const PORTS = t.ports.map(String) as [string, ...string[]];

const schema = z.object({
  host: z.string().trim().min(1, v.required).max(255, v.maxLength(255)),
  port: z.enum(PORTS),
  secure: z.boolean(),
  username: z.string().trim().min(1, v.required).max(255, v.maxLength(255)),
  fromAddress: z.string().min(1, v.required),
});
type FormValues = z.infer<typeof schema>;

type Pending = 'test' | 'save' | null;

function SenderError({ error }: { error: unknown }) {
  // The backend message explains what went wrong with the connection: shown as a detail below the friendly text.
  const detail = isApiError(error) && error.code === 'SMTP_CONNECTION_FAILED' ? error.messages[0] : undefined;
  return (
    <Alert tone="danger" title={describeError(error)[0]}>
      {detail && <p className="break-words text-xs text-muted">{t.connectionDetail(detail)}</p>}
    </Alert>
  );
}

function SenderForm({ profile, sender }: { profile: ProfileDto; sender: SenderDto }) {
  const actions = useSenderActions(profile.id);
  // The password is read from the DOM only when the user clicks a button, then dropped: it never enters React or form state.
  const passwordRef = useRef<HTMLInputElement>(null);
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [pending, setPending] = useState<Pending>(null);
  const [error, setError] = useState<unknown>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const smtp = sender.smtp;
  const [presetId, setPresetId] = useState<SenderPresetId>(detectPreset(smtp?.host));
  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      host: smtp?.host ?? '',
      port: String(smtp?.port ?? 587),
      secure: smtp?.secure ?? false,
      username: smtp?.username ?? '',
      fromAddress: smtp?.fromAddress ?? profile.emails[0] ?? '',
    },
  });

  const guide: { title: string; steps: readonly string[]; link?: string } | null = presetId === 'other' ? null : t.guides[presetId];
  const hostField = register('host');
  const fromField = register('fromAddress');

  const choosePreset = (id: SenderPresetId) => {
    setPresetId(id);
    if (id === 'other') return;
    const preset = SENDER_PRESETS[id];
    setValue('host', preset.host);
    setValue('port', String(preset.port));
    setValue('secure', preset.secure);
    setValue('username', getValues('fromAddress')); // every preset uses the full mailbox address as user name
  };

  const run = (kind: 'test' | 'save') =>
    handleSubmit(async (values) => {
      const password = passwordRef.current?.value ?? '';
      if (password === '') {
        setPasswordError(v.required);
        return;
      }
      setPasswordError(undefined);
      setError(null);
      setMessage(null);
      setPending(kind);
      const input: SmtpSettingsInput = {
        host: values.host.trim(),
        port: Number(values.port),
        secure: values.secure,
        username: values.username.trim(),
        fromAddress: values.fromAddress,
        password,
      };
      try {
        if (kind === 'test') {
          await actions.test(input);
          setMessage(t.testOk);
        } else {
          await actions.save(input);
          if (passwordRef.current) passwordRef.current.value = '';
          setMessage(t.saved);
        }
      } catch (caught) {
        setError(caught);
      } finally {
        setPending(null);
      }
    })();

  return (
    <>
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void run('save');
        }}
        className="space-y-4"
        aria-label={t.title}
      >
        <SelectField label={t.preset} hint={t.presetHint} value={presetId} onChange={(event) => choosePreset(event.target.value as SenderPresetId)}>
          {SENDER_PROVIDER_IDS.map((id) => (
            <option key={id} value={id}>
              {t.presets[id]}
            </option>
          ))}
          <option value="other">{t.presets.other}</option>
        </SelectField>
        {guide && presetId !== 'other' && (
          <Alert tone="info" title={guide.title}>
            <ol className="list-decimal space-y-1 pl-5">
              {guide.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            {guide.link && SENDER_PRESETS[presetId].appPasswordUrl && (
              <p className="mt-2">
                <a
                  href={SENDER_PRESETS[presetId].appPasswordUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-primary underline"
                >
                  {guide.link}
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              </p>
            )}
            <p className="mt-2">{t.fromNote}</p>
          </Alert>
        )}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <TextField
              label={t.host}
              hint={t.hostHint}
              autoComplete="off"
              error={errors.host?.message}
              {...hostField}
              onChange={(event) => {
                void hostField.onChange(event);
                if (presetId !== 'other' && event.target.value.trim().toLowerCase() !== SENDER_PRESETS[presetId].host) setPresetId('other');
              }}
            />
          </div>
          <SelectField label={t.port} error={errors.port?.message} {...register('port')}>
            {PORTS.map((port) => (
              <option key={port} value={port}>
                {port}
              </option>
            ))}
          </SelectField>
        </div>
        <CheckboxField label={t.secure} hint={t.secureHint} {...register('secure')} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label={t.username} autoComplete="off" error={errors.username?.message} {...register('username')} />
          <TextField
            label={t.password}
            hint={t.passwordHint}
            type="password"
            autoComplete="off"
            error={passwordError}
            ref={passwordRef}
            onChange={() => setPasswordError(undefined)}
          />
        </div>
        <SelectField
          label={t.fromAddress}
          hint={t.fromAddressHint}
          error={errors.fromAddress?.message}
          {...fromField}
          onChange={(event) => {
            void fromField.onChange(event);
            if (presetId !== 'other') setValue('username', event.target.value);
          }}
        >
          {profile.emails.map((email) => (
            <option key={email} value={email}>
              {email}
            </option>
          ))}
        </SelectField>

        {error !== null && <SenderError error={error} />}
        {message && <Alert tone="success">{message}</Alert>}

        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => void run('test')} loading={pending === 'test'} disabled={pending === 'save'}>
            <Plug className="h-4 w-4" aria-hidden="true" />
            {t.test}
          </Button>
          <Button type="submit" loading={pending === 'save'} disabled={pending === 'test'}>
            {it.common.save}
          </Button>
          {sender.mode === 'smtp' && (
            <Button variant="ghost" onClick={() => setConfirmReset(true)}>
              <Undo2 className="h-4 w-4" aria-hidden="true" />
              {t.reset}
            </Button>
          )}
        </div>
      </form>

      <ConfirmDialog
        open={confirmReset}
        title={t.resetTitle}
        description={t.resetBody}
        confirmLabel={t.resetConfirm}
        pending={actions.reset.isPending}
        error={actions.reset.isError ? actions.reset.error : undefined}
        onClose={() => setConfirmReset(false)}
        onConfirm={() =>
          actions.reset.mutate(undefined, {
            onSuccess: () => {
              setConfirmReset(false);
              setMessage(t.resetDone);
              setError(null);
            },
          })
        }
      />
    </>
  );
}

function SenderStatus({ sender }: { sender: SenderDto }) {
  return (
    <div className="space-y-2">
      <p className="text-sm">
        <span className="text-muted">{t.modeLabel}: </span>
        <Badge tone={sender.mode === 'smtp' ? 'info' : 'neutral'}>{t.mode[sender.mode]}</Badge>
      </p>
      {sender.smtp && <p className="text-sm text-muted">{t.current(sender.smtp.host, sender.smtp.port, sender.smtp.fromAddress)}</p>}
      {sender.mode === 'smtp' && (
        <p className="text-sm text-muted">{sender.verifiedAt ? t.verifiedAt(formatDateTime(sender.verifiedAt)) : t.neverVerified}</p>
      )}
      {sender.lastError && (
        <Alert tone="danger" title={t.lastErrorTitle}>
          <p className="break-words">{sender.lastError}</p>
          <p>{t.lastErrorBody}</p>
        </Alert>
      )}
      <p className="text-sm text-muted">{t.replyNote(sender.replyAddress)}</p>
    </div>
  );
}

export function SenderCard({ profile }: { profile: ProfileDto }) {
  const query = useSender(profile.id);
  if (query.isError && isFeatureDisabled(query.error)) return null;

  return (
    <Card className="space-y-4" aria-labelledby="mittente-title" id="mittente">
      <div className="flex items-center gap-2">
        <Mail className="h-5 w-5 text-primary" aria-hidden="true" />
        <CardTitle id="mittente-title">{t.title}</CardTitle>
      </div>
      <p className="text-sm text-muted">{t.intro}</p>
      <QueryBoundary query={query} errorMessage={t.loadError} skeleton={<Skeleton className="h-48 w-full" />}>
        {(sender) => (
          <div className="space-y-5">
            <SenderStatus sender={sender} />
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
              <li>{t.appPasswordTip}</li>
              <li>{t.failureNote}</li>
            </ul>
            <SenderForm profile={profile} sender={sender} />
          </div>
        )}
      </QueryBoundary>
    </Card>
  );
}
