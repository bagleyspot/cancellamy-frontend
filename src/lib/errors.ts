import { isApiError } from '@/api/http';
import { it } from '@/i18n/it';

/** Converts any thrown value into user-facing Italian messages (validation errors may be several). */
export function describeError(error: unknown): string[] {
  if (isApiError(error)) {
    if (error.code && error.code !== 'VALIDATION_ERROR') return [it.errors.byCode[error.code]];
    if (error.status === 400 && error.messages.length > 0) {
      // Validation messages come from the backend (class-validator) and are shown as received.
      return error.messages;
    }
    return [it.errors.byStatus[error.status] ?? it.common.unknownError];
  }
  if (error instanceof TypeError) return [it.common.networkError];
  return [it.common.unknownError];
}

export function isEmailNotVerified(error: unknown): boolean {
  return isApiError(error) && error.code === 'EMAIL_NOT_VERIFIED';
}

/** Endpoints of a disabled feature answer 404 FEATURE_DISABLED: that is "feature unavailable", not a failure. */
export function isFeatureDisabled(error: unknown): boolean {
  return isApiError(error) && error.code === 'FEATURE_DISABLED';
}
