import type { ReactElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { AppRoutes } from '@/app/AppRoutes';
import { AuthProvider } from '@/features/auth/auth';

export function createTestQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } });
}

interface RenderOptions {
  route?: string;
}

/** Renders a single element with router, query client and auth context. */
export function renderWithProviders(ui: ReactElement, { route = '/' }: RenderOptions = {}) {
  const queryClient = createTestQueryClient();
  return {
    queryClient,
    ...render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[route]}>
          <AuthProvider>{ui}</AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    ),
  };
}

/** Renders the whole route tree, starting at `route`. */
export function renderApp(route = '/') {
  return renderWithProviders(<AppRoutes />, { route });
}
