import { http, HttpResponse } from 'msw';
import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { queryKeys } from '@/api/queries';
import { makeConfig } from '@/test/fixtures';
import { apiUrl } from '@/test/handlers';
import { renderWithProviders } from '@/test/render';
import { server } from '@/test/server';
import { DryRunBanner } from './DryRunBanner';

describe('DryRunBanner', () => {
  it('is shown when the backend runs in dry-run mode', async () => {
    server.use(http.get(apiUrl('/config'), () => HttpResponse.json(makeConfig({ mailMode: 'dry-run' }))));
    renderWithProviders(<DryRunBanner />);
    expect(await screen.findByText('Modalità prova: nessuna email reale viene inviata ai broker')).toBeInTheDocument();
  });

  it('is hidden when real emails are sent', async () => {
    server.use(http.get(apiUrl('/config'), () => HttpResponse.json(makeConfig({ mailMode: 'resend' }))));
    const { queryClient } = renderWithProviders(<DryRunBanner />);
    await waitFor(() => expect(queryClient.getQueryData(queryKeys.config)).toBeDefined());
    expect(screen.queryByText(/Modalità prova/)).not.toBeInTheDocument();
  });
});
