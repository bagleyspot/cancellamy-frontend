import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router';
import { api } from '@/api/endpoints';
import { it } from '@/i18n/it';
import { ApiErrorAlert } from '@/components/ApiErrorAlert';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/Field';
import { AuthCard } from './AuthCard';
import { forgotSchema } from './schemas';
import type { ForgotForm } from './schemas';

export function ForgotPasswordPage() {
  const [error, setError] = useState<unknown>(null);
  const [done, setDone] = useState(false);
  const t = it.auth;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotForm>({ resolver: zodResolver(forgotSchema), defaultValues: { email: '' } });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      await api.auth.forgotPassword(values);
      setDone(true);
    } catch (caught) {
      setError(caught);
    }
  });

  return (
    <AuthCard title={t.forgot.title} subtitle={done ? undefined : t.forgot.subtitle}>
      {done ? (
        <Alert tone="success">{t.forgot.done}</Alert>
      ) : (
        <form onSubmit={(event) => void onSubmit(event)} noValidate className="space-y-4">
          <TextField label={t.email} type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
          <ApiErrorAlert error={error} />
          <Button type="submit" className="w-full" loading={isSubmitting}>
            {t.forgot.submit}
          </Button>
        </form>
      )}
      <p className="text-sm">
        <Link to="/accedi" className="font-medium text-primary underline underline-offset-2">
          {t.forgot.backToLogin}
        </Link>
      </p>
    </AuthCard>
  );
}
