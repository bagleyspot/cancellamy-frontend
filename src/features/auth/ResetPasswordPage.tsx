import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useSearchParams } from 'react-router';
import { api } from '@/api/endpoints';
import { it } from '@/i18n/it';
import { ApiErrorAlert } from '@/components/ApiErrorAlert';
import { Alert } from '@/components/ui/Alert';
import { Button, ButtonLink } from '@/components/ui/Button';
import { TextField } from '@/components/ui/Field';
import { AuthCard } from './AuthCard';
import { resetSchema } from './schemas';
import type { ResetForm } from './schemas';

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [error, setError] = useState<unknown>(null);
  const [done, setDone] = useState(false);
  const t = it.auth;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetForm>({ resolver: zodResolver(resetSchema), defaultValues: { password: '', confirm: '' } });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      await api.auth.resetPassword({ token, password: values.password });
      setDone(true);
    } catch (caught) {
      setError(caught);
    }
  });

  if (token.length === 0) {
    return (
      <AuthCard title={t.reset.title}>
        <Alert tone="danger">{t.reset.missingToken}</Alert>
        <Link to="/password-dimenticata" className="text-sm font-medium text-primary underline underline-offset-2">
          {t.reset.requestNew}
        </Link>
      </AuthCard>
    );
  }

  if (done) {
    return (
      <AuthCard title={t.reset.title}>
        <Alert tone="success">{t.reset.done}</Alert>
        <ButtonLink to="/accedi" className="w-full">
          {t.login.submit}
        </ButtonLink>
      </AuthCard>
    );
  }

  return (
    <AuthCard title={t.reset.title} subtitle={t.reset.subtitle}>
      <form onSubmit={(event) => void onSubmit(event)} noValidate className="space-y-4">
        <TextField
          label={t.newPassword}
          type="password"
          autoComplete="new-password"
          hint={t.passwordHint}
          error={errors.password?.message}
          {...register('password')}
        />
        <TextField
          label={t.confirmPassword}
          type="password"
          autoComplete="new-password"
          error={errors.confirm?.message}
          {...register('confirm')}
        />
        <ApiErrorAlert error={error} />
        <Button type="submit" className="w-full" loading={isSubmitting}>
          {t.reset.submit}
        </Button>
      </form>
      <Link to="/password-dimenticata" className="text-sm font-medium text-primary underline underline-offset-2">
        {t.reset.requestNew}
      </Link>
    </AuthCard>
  );
}
