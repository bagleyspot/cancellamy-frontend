import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router';
import { it } from '@/i18n/it';
import { ApiErrorAlert } from '@/components/ApiErrorAlert';
import { Alert } from '@/components/ui/Alert';
import { ButtonLink, Button } from '@/components/ui/Button';
import { CheckboxField, TextField } from '@/components/ui/Field';
import { AuthCard } from './AuthCard';
import { useAuth } from './auth';
import { registerSchema } from './schemas';
import type { RegisterForm } from './schemas';

export function RegisterPage() {
  const { register: signUp } = useAuth();
  const [error, setError] = useState<unknown>(null);
  const [done, setDone] = useState(false);
  const t = it.auth;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '', acceptTerms: false },
  });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      await signUp({ email: values.email, password: values.password, acceptTerms: true });
      setDone(true);
    } catch (caught) {
      setError(caught);
    }
  });

  if (done) {
    return (
      <AuthCard title={t.register.doneTitle}>
        <Alert tone="success">{t.register.doneBody}</Alert>
        <ButtonLink to="/app" className="w-full">
          {t.register.doneCta}
        </ButtonLink>
      </AuthCard>
    );
  }

  return (
    <AuthCard title={t.register.title} subtitle={t.register.subtitle}>
      <form onSubmit={(event) => void onSubmit(event)} noValidate className="space-y-4">
        <TextField label={t.email} type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
        <TextField
          label={t.password}
          type="password"
          autoComplete="new-password"
          hint={t.passwordHint}
          error={errors.password?.message}
          {...register('password')}
        />
        <CheckboxField
          label={
            <>
              {t.register.acceptPrefix}{' '}
              <Link to="/termini" target="_blank" className="font-medium text-primary underline">
                {t.register.termsLink}
              </Link>{' '}
              {t.register.acceptAnd}{' '}
              <Link to="/privacy" target="_blank" className="font-medium text-primary underline">
                {t.register.privacyLink}
              </Link>
            </>
          }
          error={errors.acceptTerms?.message}
          {...register('acceptTerms')}
        />
        <ApiErrorAlert error={error} />
        <Button type="submit" className="w-full" loading={isSubmitting}>
          {t.register.submit}
        </Button>
      </form>
      <p className="text-sm text-muted">
        {t.register.haveAccount}{' '}
        <Link to="/accedi" className="font-medium text-primary underline underline-offset-2">
          {t.register.loginLink}
        </Link>
      </p>
    </AuthCard>
  );
}
