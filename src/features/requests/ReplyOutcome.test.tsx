import { http, HttpResponse } from 'msw';
import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { makeRequestDetail, makeRequestListItem, makeSummary, paginated } from '@/test/fixtures';
import { apiUrl, signedInHandlers } from '@/test/handlers';
import { renderApp } from '@/test/render';
import { server } from '@/test/server';

const answered = makeRequestListItem({
  id: 'r1',
  broker: { id: 'b1', name: 'Broker Risposto', website: null, category: 'data_broker' },
  status: 'completed',
  group: 'completed',
  reply: { outcome: 'no_data_held', date: '2026-11-05T22:30:00.000Z', note: 'Dice di non avere dati sul richiedente.' },
});
const silent = makeRequestListItem({ id: 'r2', broker: { id: 'b2', name: 'Broker Muto', website: null, category: 'data_broker' } });

describe('requests: how brokers answered', () => {
  it('shows the outcome and the note on each answered request in the list', async () => {
    server.use(
      ...signedInHandlers(),
      http.get(apiUrl('/requests/summary'), () => HttpResponse.json(makeSummary())),
      http.get(apiUrl('/requests'), () => HttpResponse.json(paginated([answered, silent]))),
    );
    renderApp('/app/richieste?group=completed');

    const row = (await screen.findByText('Broker Risposto')).closest('a') as HTMLElement;
    expect(within(row).getByText('Dice di non avere tuoi dati')).toBeInTheDocument();
    expect(within(row).getByText('Dice di non avere dati sul richiedente.')).toBeInTheDocument();
    const quiet = screen.getByText('Broker Muto').closest('a') as HTMLElement;
    expect(within(quiet).queryByText('Dice di non avere tuoi dati')).not.toBeInTheDocument();
  });

  it('shows the answer box in the request detail, and nothing when no answer was recorded', async () => {
    const withReply = makeRequestDetail({
      id: 'r1',
      status: 'action_required',
      group: 'action_required',
      actionReason: 'manual_form',
      reply: { outcome: 'needs_portal', date: '2026-11-05T22:30:00.000Z', note: 'Serve il portale Privacy Center.' },
    });
    server.use(...signedInHandlers(), http.get(apiUrl('/requests/r1'), () => HttpResponse.json(withReply)));
    renderApp('/app/richieste/r1');

    expect(await screen.findByText('Risposta del broker: Serve il suo portale')).toBeInTheDocument();
    expect(screen.getByText('Serve il portale Privacy Center.')).toBeInTheDocument();
  });

  it('has no answer box while nothing was recorded', async () => {
    const plain = makeRequestDetail({ id: 'r3', status: 'sent' });
    server.use(...signedInHandlers(), http.get(apiUrl('/requests/r3'), () => HttpResponse.json(plain)));
    renderApp('/app/richieste/r3');

    expect(await screen.findByRole('heading', { name: 'Pagine Esempio' })).toBeInTheDocument();
    expect(screen.queryByText(/Risposta del broker/)).not.toBeInTheDocument();
  });
});
