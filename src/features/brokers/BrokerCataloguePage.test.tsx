import { http, HttpResponse } from 'msw';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { makeBroker, paginated } from '@/test/fixtures';
import { apiUrl } from '@/test/handlers';
import { renderApp } from '@/test/render';
import { server } from '@/test/server';

function trackBrokerQueries() {
  const queries: URLSearchParams[] = [];
  server.use(
    http.get(apiUrl('/brokers'), ({ request }) => {
      queries.push(new URL(request.url).searchParams);
      return HttpResponse.json(
        paginated(
          [
            makeBroker({ id: 'b1', name: 'Pagine Esempio' }),
            makeBroker({ id: 'b2', name: 'Altro Broker', category: 'data_broker', verificationStatus: 'needs_research', sendEnabled: false }),
          ],
          { total: 30, limit: 12 },
        ),
      );
    }),
  );
  return queries;
}

describe('public broker catalogue', () => {
  it('lists brokers with verified and contacted badges', async () => {
    trackBrokerQueries();
    renderApp('/broker');

    const first = (await screen.findByText('Pagine Esempio')).closest('button');
    expect(first).not.toBeNull();
    expect(within(first as HTMLElement).getByText('Verificato')).toBeInTheDocument();
    expect(within(first as HTMLElement).getByText('Contattato da Cancellamy')).toBeInTheDocument();
    const second = screen.getByText('Altro Broker').closest('button');
    expect(within(second as HTMLElement).getByText('Non ancora contattato automaticamente')).toBeInTheDocument();
    expect(within(second as HTMLElement).getByText('Da approfondire')).toBeInTheDocument();
  });

  it('sends search, category, status and sendable filters to the API', async () => {
    const queries = trackBrokerQueries();
    const user = userEvent.setup();
    renderApp('/broker');
    await screen.findByText('Pagine Esempio');

    await user.type(screen.getByLabelText('Cerca per nome'), 'pagine');
    await waitFor(() => expect(queries.at(-1)?.get('q')).toBe('pagine'));

    await user.selectOptions(screen.getByLabelText('Categoria'), 'phone_directory');
    await waitFor(() => expect(queries.at(-1)?.get('category')).toBe('phone_directory'));

    await user.selectOptions(screen.getByLabelText('Verifica'), 'verified');
    await waitFor(() => expect(queries.at(-1)?.get('status')).toBe('verified'));

    await user.click(screen.getByLabelText('Solo quelli contattati automaticamente'));
    await waitFor(() => expect(queries.at(-1)?.get('sendable')).toBe('true'));

    const last = queries.at(-1);
    expect(last?.get('q')).toBe('pagine');
    expect(last?.get('category')).toBe('phone_directory');
    expect(last?.get('status')).toBe('verified');
  });

  it('paginates', async () => {
    const queries = trackBrokerQueries();
    const user = userEvent.setup();
    renderApp('/broker');
    await screen.findByText('Pagine Esempio');

    await user.click(screen.getByRole('button', { name: 'Successiva' }));

    await waitFor(() => expect(queries.at(-1)?.get('page')).toBe('2'));
    expect(queries.at(-1)?.get('limit')).toBe('12');
  });

  it('shows an empty state and resets filters', async () => {
    server.use(http.get(apiUrl('/brokers'), () => HttpResponse.json(paginated([], { limit: 12 }))));
    renderApp('/broker?q=nessuno');

    expect(await screen.findByText('Nessun broker corrisponde ai filtri')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Azzera i filtri' }).length).toBeGreaterThan(0);
  });

  it('opens a detail dialog with channels, legal note and obstacles', async () => {
    trackBrokerQueries();
    const user = userEvent.setup();
    renderApp('/broker');

    await user.click(await screen.findByRole('button', { name: 'Dettagli di Pagine Esempio' }));

    const dialog = await screen.findByRole('dialog', { name: 'Pagine Esempio' });
    expect(within(dialog).getByText('privacy@pagine.example')).toBeInTheDocument();
    expect(within(dialog).getByText(/Art\. 17 GDPR/)).toBeInTheDocument();
    expect(within(dialog).getByText('Può chiedere un documento di identità.')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});
