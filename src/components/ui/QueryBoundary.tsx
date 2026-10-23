import type { ReactNode } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import { it } from '@/i18n/it';
import { isFeatureDisabled } from '@/lib/errors';
import { Alert } from './Alert';
import { ErrorState } from './ErrorState';
import { SkeletonList } from './Skeleton';

interface QueryBoundaryProps<T> {
  query: UseQueryResult<T>;
  skeleton?: ReactNode;
  errorMessage?: string;
  children: (data: T) => ReactNode;
}

/** Renders loading skeleton, error state with retry, or the data. A disabled feature (404 FEATURE_DISABLED) is shown as unavailable. */
export function QueryBoundary<T>({ query, skeleton, errorMessage, children }: QueryBoundaryProps<T>) {
  if (query.isPending) return <>{skeleton ?? <SkeletonList label={it.common.loading} />}</>;
  if (query.isError && isFeatureDisabled(query.error)) return <Alert tone="info">{it.features.sectionUnavailable}</Alert>;
  if (query.isError) {
    return <ErrorState error={query.error} message={errorMessage} onRetry={() => void query.refetch()} />;
  }
  return <>{children(query.data)}</>;
}
