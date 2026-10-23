import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router';
import { it } from '@/i18n/it';
import { ForgotPasswordPage } from '@/features/auth/ForgotPasswordPage';
import { LoginPage } from '@/features/auth/LoginPage';
import { RegisterPage } from '@/features/auth/RegisterPage';
import { ResetPasswordPage } from '@/features/auth/ResetPasswordPage';
import { VerifyEmailPage } from '@/features/auth/VerifyEmailPage';
import { FullPageLoader, GuestRoute, ProtectedRoute } from '@/features/auth/routes';
import { FeatureRoute } from '@/components/FeatureRoute';
import { BrokerCataloguePage } from '@/features/brokers/BrokerCataloguePage';
import { LeaderboardPage } from '@/features/leaderboard/LeaderboardPage';
import { HowItWorksPage } from '@/features/public/HowItWorksPage';
import { LandingPage } from '@/features/public/LandingPage';
import { PrivacyPage, TermsPage } from '@/features/public/LegalPage';
import { NotFoundPage } from '@/features/public/NotFoundPage';
import { PublicLayout } from '@/features/shell/PublicLayout';

const AppArea = lazy(() => import('@/features/shell/AppArea'));

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="come-funziona" element={<HowItWorksPage />} />
        <Route path="broker" element={<BrokerCataloguePage />} />
        <Route
          path="classifica"
          element={
            <FeatureRoute feature="leaderboard" area="public">
              <LeaderboardPage />
            </FeatureRoute>
          }
        />
        <Route path="privacy" element={<PrivacyPage />} />
        <Route path="termini" element={<TermsPage />} />
        <Route element={<GuestRoute />}>
          <Route path="accedi" element={<LoginPage />} />
        </Route>
        <Route path="registrati" element={<RegisterPage />} />
        <Route path="verifica-email" element={<VerifyEmailPage />} />
        <Route path="password-dimenticata" element={<ForgotPasswordPage />} />
        <Route path="reimposta-password" element={<ResetPasswordPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      <Route
        path="app/*"
        element={
          <ProtectedRoute>
            <Suspense fallback={<FullPageLoader label={it.common.loading} />}>
              <AppArea />
            </Suspense>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
