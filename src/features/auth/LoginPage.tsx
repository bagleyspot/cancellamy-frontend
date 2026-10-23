import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useLocation, useNavigate } from 'react-router';
import { it } from '@/i18n/it';
import { ApiErrorAlert } from '@/components/ApiErrorAlert';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/Field';
import { AuthCard } from './AuthCard';
import { useAuth } from './auth';
import { loginSchema } from './schemas';
import type { LoginForm } from './schemas';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<unknown>(null);
  const from = (location.state as { from?: string } | null)?.from;
  const t = it.auth;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      await login(values);
      void navigate(from ?? '/app', { replace: true });
    } catch (caught) {
      setError(caught);
    }
  });

  return (
    <AuthCard title={t.login.title} subtitle={t.login.subtitle}>
      <form onSubmit={(event) => void onSubmit(event)} noValidate className="space-y-4">
        <TextField
          label={t.email}
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <TextField
          label={t.password}
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <ApiErrorAlert error={error} />
        <Button type="submit" className="w-full" loading={isSubmitting}>
          {t.login.submit}
        </Button>
      </form>
      <div className="space-y-2 text-sm">
        <p>
          <Link to="/password-dimenticata" className="font-medium text-primary underline underline-offset-2">
            {t.login.forgot}
          </Link>
        </p>
        <p className="text-muted">
          {t.login.noAccount}{' '}
          <Link to="/registrati" className="font-medium text-primary underline underline-offset-2">
            {t.login.registerLink}
          </Link>
        </p>
      </div>
    </AuthCard>
  );
}
