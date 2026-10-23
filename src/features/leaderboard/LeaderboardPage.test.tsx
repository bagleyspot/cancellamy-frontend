import { http, HttpResponse } from 'msw';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { makeLeaderboard, makePerformance } from '@/test/fixtures';
import { apiUrl } from '@/test/handlers';
import { renderApp } from '@/test/render';
import { server } from '@/test/server';

describe('public leaderboard (/classifica)', () => {
  it('renders the table with it-IT formatted numbers, without being signed in', async () => {
    server.use(
      http.get(apiUrl('/brokers/leaderboard'), () =>
        HttpResponse.json(
          makeLeaderboard({
            items: [
              makePerformance({ users: 12500, responseRate: 0.72, completionRate: 0.5, refusalRate: 0.12, overdueRate: 0.07, medianDaysToFirstReply: 3.5, medianDaysToCompletion: 12 }),
              makePerformance({
                broker: { id: 'b2', name: 'Dati Srl', website: null, category: 'data_broker' },
                responseRate: 0.3,
                medianDaysToFirstReply: null,
                medianDaysToCompletion: null,
              }),
            ],
          }),
        ),
      ),
    );
    renderApp('/classifica');

    const table = await screen.findByRole('table', { name: 'Classifica dei broker per qualità delle risposte' });
    const rows = within(table).getAllByRole('row');
    const first = within(rows[1] as HTMLElement);
    expect(first.getByText('Pagine Esempio')).toBeInTheDocument();
    expect(first.getByText('12.500')).toBeInTheDocument();
    expect(first.getByText('72%')).toBeInTheDocument();
    expect(first.getByText('50%')).toBeInTheDocument();
    expect(first.getByText('12%')).toBeInTheDocument();
    expect(first.getByText('7%')).toBeInTheDocument();
    expect(first.getByText('3,5 gg')).toBeInTheDocument();
    expect(first.getByText('12 gg')).toBeInTheDocument();
    const second = within(rows[2] as HTMLElement);
    expect(second.getByText('30%')).toBeInTheDocument();
    expect(second.getAllByText('-')).toHaveLength(2);
    for (const heading of ['Broker', 'Utenti', 'Risposte', 'Completate', 'Rifiuti', 'In ritardo', 'Giorni alla prima risposta', 'Giorni al completamento']) {
      expect(within(table).getByRole('columnheader', { name: heading })).toBeInTheDocument();
    }
  });

  it('explains the privacy threshold using minUsers and the number of hidden brokers', async () => {
    server.use(http.get(apiUrl('/brokers/leaderboard'), () => HttpResponse.json(makeLeaderboard({ minUsers: 8, hiddenBrokers: 23 }))));
    renderApp('/classifica');

    expect(await screen.findByText('Come proteggiamo la privacy')).toBeInTheDocument();
    expect(screen.getByText(/almeno 8 utenti diversi/)).toBeInTheDocument();
    expect(screen.getByText(/23 broker del registro non compaiono ancora/)).toBeInTheDocument();
  });

  it('shows an empty state when there is not enough data yet (the privacy note stays)', async () => {
    server.use(http.get(apiUrl('/brokers/leaderboard'), () => HttpResponse.json(makeLeaderboard({ items: [], hiddenBrokers: 120 }))));
    renderApp('/classifica');

    expect(await screen.findByText('Non ci sono ancora dati sufficienti')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getByText('Come proteggiamo la privacy')).toBeInTheDocument();
  });

  it('sends sort, order and category to the API when the filters change', async () => {
    const user = userEvent.setup();
    const queries: URLSearchParams[] = [];
    server.use(
      http.get(apiUrl('/brokers/leaderboard'), ({ request }) => {
        queries.push(new URL(request.url).searchParams);
        return HttpResponse.json(makeLeaderboard());
      }),
    );
    renderApp('/classifica');
    await screen.findByRole('table');
    expect(queries[0]?.get('sort')).toBe('responseRate');
    expect(queries[0]?.get('order')).toBe('desc');
    expect(queries[0]?.has('category')).toBe(false);

    await user.selectOptions(screen.getByLabelText('Ordina per'), 'medianDaysToFirstReply');
    await user.selectOptions(screen.getByLabelText('Ordine'), 'asc');
    await user.selectOptions(screen.getByLabelText('Categoria'), 'data_broker');

    await screen.findByRole('table');
    const last = queries.at(-1);
    expect(last?.get('sort')).toBe('medianDaysToFirstReply');
    expect(last?.get('order')).toBe('asc');
    expect(last?.get('category')).toBe('data_broker');
    const sorted = screen.getByRole('columnheader', { name: 'Giorni alla prima risposta' });
    expect(sorted).toHaveAttribute('aria-sort', 'ascending');
  });

  it('shows a retryable error state when the API fails', async () => {
    server.use(http.get(apiUrl('/brokers/leaderboard'), () => HttpResponse.json({ statusCode: 500, error: 'Internal', message: 'x' }, { status: 500 })));
    renderApp('/classifica');

    expect(await screen.findByText('Non siamo riusciti a caricare la classifica.', undefined, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Riprova' })).toBeInTheDocument();
  });
});
