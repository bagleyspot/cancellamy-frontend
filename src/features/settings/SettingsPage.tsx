import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { useNavigate } from 'react-router';
import { z } from 'zod';
import { api } from '@/api/endpoints';
import type { UserSettings } from '@/api/types';
import { it } from '@/i18n/it';
import { downloadBlob } from '@/lib/files';
import { ApiErrorAlert } from '@/components/ApiErrorAlert';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardTitle } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { CheckboxField, TextField } from '@/components/ui/Field';
import { PageHeader } from '@/components/ui/PageHeader';
import { useAuth, useCurrentUser } from '@/features/auth/auth';
import { passwordSchema } from '@/features/auth/schemas';

function NotificationSettings() {
  const t = it.settings;
  const user = useCurrentUser();
  const { setUser } = useAuth();
  const update = useMutation({
    mutationFn: (settings: Partial<UserSettings>) => api.me.update({ settings }),
    onSuccess: setUser,
  });
  return (
    <Card className="space-y-4">
      <CardTitle>{t.notifications}</CardTitle>
      <CheckboxField
        label={t.notifyByEmail}
        hint={t.notifyByEmailHint}
        checked={user.settings.notifyByEmail}
        disabled={update.isPending}
        onChange={(event) => update.mutate({ notifyByEmail: event.target.checked })}
      />
      <CheckboxField
        label={t.monthlyReport}
        hint={t.monthlyReportHint}
        checked={user.settings.monthlyReport}
        disabled={update.isPending}
        onChange={(event) => update.mutate({ monthlyReport: event.target.checked })}
      />
      {update.isSuccess && <p role="status" className="text-sm font-medium text-success">{t.saved}</p>}
      <ApiErrorAlert error={update.isError ? update.error : null} />
    </Card>
  );
}

const passwordFormSchema = z
  .object({ currentPassword: z.string().min(1, it.validation.required), newPassword: passwordSchema, confirm: z.string() })
  .refine((data) => data.newPassword === data.confirm, { message: it.validation.passwordMismatch, path: ['confirm'] });
type PasswordForm = z.infer<typeof passwordFormSchema>;

function ChangePasswordCard() {
  const t = it.settings;
  const change = useMutation({ mutationFn: api.me.changePassword });
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordForm>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirm: '' },
  });

  const onSubmit = handleSubmit((values) => {
    change.mutate({ currentPassword: values.currentPassword, newPassword: values.newPassword }, { onSuccess: () => reset() });
  });

  return (
    <Card className="space-y-4">
      <CardTitle>{t.password}</CardTitle>
      <form onSubmit={(event) => void onSubmit(event)} noValidate className="space-y-4">
        <TextField label={t.currentPassword} type="password" autoComplete="current-password" error={errors.currentPassword?.message} {...register('currentPassword')} />
        <TextField
          label={t.newPassword}
          type="password"
          autoComplete="new-password"
          hint={it.auth.passwordHint}
          error={errors.newPassword?.message}
          {...register('newPassword')}
        />
        <TextField label={t.confirmPassword} type="password" autoComplete="new-password" error={errors.confirm?.message} {...register('confirm')} />
        {change.isSuccess && <Alert tone="success">{t.passwordChanged}</Alert>}
        <ApiErrorAlert error={change.isError ? change.error : null} />
        <Button type="submit" loading={change.isPending}>
          {t.changePassword}
        </Button>
      </form>
    </Card>
  );
}

function DataCard() {
  const t = it.settings;
  const exportData = useMutation({
    mutationFn: async () => downloadBlob(await api.me.export(), t.exportFileName),
  });
  return (
    <Card className="space-y-4">
      <CardTitle>{t.data}</CardTitle>
      <p className="text-sm text-muted">{t.dataBody}</p>
      <Button variant="secondary" onClick={() => exportData.mutate()} loading={exportData.isPending}>
        <Download className="h-4 w-4" aria-hidden="true" />
        {t.export}
      </Button>
      <ApiErrorAlert error={exportData.isError ? exportData.error : null} />
    </Card>
  );
}

function DeleteAccountCard() {
  const t = it.settings;
  const navigate = useNavigate();
  const { clearSession } = useAuth();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [missing, setMissing] = useState(false);
  const remove = useMutation({ mutationFn: api.me.delete });

  const close = () => {
    setOpen(false);
    setPassword('');
    setMissing(false);
    remove.reset();
  };

  const confirm = () => {
    if (password.length === 0) {
      setMissing(true);
      return;
    }
    remove.mutate(
      { password },
      {
        onSuccess: () => {
          clearSession();
          void navigate('/', { replace: true });
        },
      },
    );
  };

  return (
    <Card className="space-y-4 border-danger/40">
      <CardTitle>{t.danger}</CardTitle>
      <p className="text-sm text-muted">{t.dangerBody}</p>
      <Button variant="danger" onClick={() => setOpen(true)}>
        {t.deleteOpen}
      </Button>
      <ConfirmDialog
        open={open}
        title={t.deleteTitle}
        description={t.deleteBody}
        confirmLabel={t.deleteConfirm}
        danger
        pending={remove.isPending}
        error={remove.isError ? remove.error : undefined}
        onClose={close}
        onConfirm={confirm}
      >
        <TextField
          label={it.auth.password}
          type="password"
          autoComplete="current-password"
          value={password}
          error={missing && password.length === 0 ? it.validation.required : undefined}
          onChange={(event) => setPassword(event.target.value)}
        />
      </ConfirmDialog>
    </Card>
  );
}

export function SettingsPage() {
  const t = it.settings;
  const user = useCurrentUser();
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title={t.title} />
      <Card className="space-y-2">
        <CardTitle>{t.account}</CardTitle>
        <p className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted">{t.emailLabel}:</span>
          <span className="font-medium">{user.email}</span>
          <Badge tone={user.emailVerified ? 'success' : 'warning'}>{user.emailVerified ? t.verified : t.notVerified}</Badge>
        </p>
      </Card>
      <NotificationSettings />
      <ChangePasswordCard />
      <DataCard />
      <DeleteAccountCard />
    </div>
  );
}
