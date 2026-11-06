import { http, HttpResponse } from 'msw';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { BrokerObservationDto } from '@/api/types';
import { makeBroker, makeRequestDetail, paginated } from '@/test/fixtures';
import { apiUrl, signedInHandlers } from '@/test/handlers';
import { renderApp } from '@/test/render';
import { server } from '@/test/server';

const bounced: BrokerObservationDto = {
  date: '2026-11-05',
  outcome: 'bounce_no_mailbox',
  reachable: false,
  channel: 'privacy@pagine.example',
  requires: [],
  note: 'Mailbox does not exist (550 5.1.1). Use the web form.',
};
const portal: BrokerObservationDto = {
  date: '2026-11-06',
  outcome: 'needs_portal',
  reachable: true,
  channel: 'privacy@altro.example',
  requires: ['portal', 'email_verification'],
  note: 'Requests go through its Privacy Center.',
};

describe('broker observations in the catalogue', () => {
  it('shows the latest outcome as a badge and the full list in the broker dialog', async () => {
    const user = userEvent.setup();
    server.use(
      http.get(apiUrl('/brokers'), () =>
        HttpResponse.json(
          paginated([makeBroker({ id: 'b1', name: 'Pagine Esempio', observed: [portal, bounced] }), makeBroker({ id: 'b2', name: 'Mai Osservato' })], { limit: 12 }),
        ),
      ),
    );
    renderApp('/broker');

    const first = (await screen.findByText('Pagine Esempio')).closest('button') as HTMLElement;
    expect(within(first).getByText('Serve il suo portale')).toBeInTheDocument(); // the newest observation wins
    const second = screen.getByText('Mai Osservato').closest('button') as HTMLElement;
    expect(within(second).queryByText('Serve il suo portale')).not.toBeInTheDocument();

    await user.click(first);
    const section = await screen.findByRole('region', { name: 'Cosa abbiamo osservato' });
    expect(within(section).getByText('Indirizzo non raggiungibile')).toBeInTheDocument();
    expect(within(section).getByText('Non raggiungibile con questo canale')).toBeInTheDocument();
    expect(within(section).getByText('Mailbox does not exist (550 5.1.1). Use the web form.')).toBeInTheDocument();
    expect(within(section).getByText(/Portale o modulo web, Verifica via email/)).toBeInTheDocument();
    expect(within(section).getByText('Contatto: privacy@altro.example')).toBeInTheDocument();
  });

  it('hides the section when the broker was never observed', async () => {
    const user = userEvent.setup();
    server.use(http.get(apiUrl('/brokers'), () => HttpResponse.json(paginated([makeBroker({ id: 'b1', name: 'Pagine Esempio' })], { limit: 12 }))));
    renderApp('/broker');

    await user.click((await screen.findByText('Pagine Esempio')).closest('button') as HTMLElement);

    expect(await screen.findByText('Nota legale')).toBeInTheDocument();
    expect(screen.queryByText('Cosa abbiamo osservato')).not.toBeInTheDocument();
  });
});

describe('broker observations in a request detail', () => {
  it('shows what the broker did when it was contacted', async () => {
    const detail = makeRequestDetail({ status: 'sent' });
    server.use(...signedInHandlers(), http.get(apiUrl(`/requests/${detail.id}`), () => HttpResponse.json({ ...detail, broker: makeBroker({ observed: [portal] }) })));
    renderApp(`/app/richieste/${detail.id}`);

    const section = await screen.findByRole('region', { name: 'Cosa abbiamo osservato' });
    expect(within(section).getByText('Serve il suo portale')).toBeInTheDocument();
    expect(within(section).getByText('Requests go through its Privacy Center.')).toBeInTheDocument();
  });
});
