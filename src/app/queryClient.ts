import { QueryClient } from '@tanstack/react-query';
import { isApiError } from '@/api/http';

const MAX_RETRIES = 2;

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Client errors (4xx) are answers, not outages: retrying them only delays the error state.
        retry: (failureCount, error) => !(isApiError(error) && error.status < 500) && failureCount < MAX_RETRIES,
        refetchOnWindowFocus: false,
        staleTime: 15_000,
      },
    },
  });
}
