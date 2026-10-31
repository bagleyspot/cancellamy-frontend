import { http, HttpResponse } from 'msw';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { PublicConfigDto, RequestListItem, SendRequestsRequest, SendRequestsResponse } from '@/api/types';
import { makeConfig, makeRequestListItem, makeSummary, paginated } from '@/test/fixtures';
import { apiUrl, signedInHandlers } from '@/test/handlers';
import { renderApp } from '@/test/render';
import { server } from '@/test/server';

const drafts = (n: number): RequestListItem[] =>
  Array.from({ length: n }, (_, i) =>
    makeRequestListItem({
      id: `draft-${i + 1}`,
      shortRef: `CNC-D${i + 1}`,
      broker: { id: `b-${i + 1}`, name: `Broker ${i + 1}`, website: null, category: 'marketing_adtech' },
      status: 'draft',
      group: 'to_send',
      sentAt: null,
      dueAt: null,
    }),
  );

interface Setup {
  sendSelection?: PublicConfigDto['sendSelection'];
  items?: RequestListItem[];
  response?: SendRequestsResponse;
}

/** Serves `items` for group=to_send (and removes the sent ones once /requests/send has answered). */
function openDrafts({ sendSelection = 'manual', items = drafts(12), response }: Setup = {}) {
  const posted: SendRequestsRequest[] = [];
  let remaining = items;
  server.use(
    ...signedInHandlers(),
    http.get(apiUrl('/config'), () => HttpResponse.json(makeConfig({ sendSelection, sendSelectionMax: 10 }))),
    http.get(apiUrl('/requests/summary'), () => HttpResponse.json(makeSummary({ counts: { total: 12, toSend: remaining.length, inProgress: 0, actionRequired: 0, completed: 0, notRemovable: 0 } }))),
    http.get(apiUrl('/requests'), ({ request }) => {
      const group = new URL(request.url).searchParams.get('group');
      return HttpResponse.json(paginated(group === 'to_send' ? remaining : []));
    }),
    http.post(apiUrl('/requests/send'), async ({ request }) => {
      const body = (await request.json()) as SendRequestsRequest;
      posted.push(body);
      const result = response ?? { queued: body.requestIds.length, skipped: [] };
      const gone = new Set(body.requestIds.filter((id) => !result.skipped.some((s) => s.id === id)));
      remaining = remaining.filter((item) => !gone.has(item.id));
      return HttpResponse.json(result);
    }),
  );
  return { posted, renderPage: () => renderApp('/app/richieste?group=to_send') };
}

const checkboxes = () => screen.getAllByRole('checkbox');

describe('requests: choosing which drafts to send', () => {
  it('shows a checkbox per draft with a counter and the limit of 10', async () => {
    const { renderPage } = openDrafts();
    renderPage();

    expect(await screen.findByText('0 selezionate (massimo 10)')).toBeInTheDocument();
    expect(await screen.findAllByRole('checkbox')).toHaveLength(12);
    expect(screen.getByRole('button', { name: 'Invia selezionate' })).toBeDisabled();
    expect(screen.getByText(/al massimo 10 per volta/)).toBeInTheDocument();
  });

  it('disables every other checkbox once 10 are selected and frees them when one is unchecked', async () => {
    const user = userEvent.setup();
    const { renderPage } = openDrafts();
    renderPage();
    await screen.findAllByRole('checkbox');

    for (const box of checkboxes().slice(0, 10)) await user.click(box);

    expect(screen.getByText('10 selezionate (massimo 10)')).toBeInTheDocument();
    expect(screen.getByText(/Hai raggiunto il massimo di 10/)).toBeInTheDocument();
    expect(checkboxes().slice(0, 10).every((box) => !(box as HTMLInputElement).disabled)).toBe(true);
    expect(checkboxes().slice(10).every((box) => (box as HTMLInputElement).disabled)).toBe(true);

    await user.click(checkboxes()[0]!);
    expect(screen.getByText('9 selezionate (massimo 10)')).toBeInTheDocument();
    expect(checkboxes()[10]).toBeEnabled();
  });

  it('selects the first 10 with one click and clears the selection', async () => {
    const user = userEvent.setup();
    const { renderPage } = openDrafts();
    renderPage();
    await screen.findAllByRole('checkbox');

    await user.click(screen.getByRole('button', { name: 'Seleziona le prime 10' }));
    expect(screen.getByText('10 selezionate (massimo 10)')).toBeInTheDocument();
    expect(checkboxes().filter((box) => (box as HTMLInputElement).checked)).toHaveLength(10);

    await user.click(screen.getByRole('button', { name: 'Deseleziona tutto' }));
    expect(screen.getByText('0 selezionate (massimo 10)')).toBeInTheDocument();
  });

  it('sends exactly the chosen ids, confirms, clears the selection and refreshes the list', async () => {
    const user = userEvent.setup();
    const { posted, renderPage } = openDrafts();
    renderPage();
    await screen.findAllByRole('checkbox');

    await user.click(screen.getByRole('checkbox', { name: 'Seleziona la richiesta per Broker 2' }));
    await user.click(screen.getByRole('checkbox', { name: 'Seleziona la richiesta per Broker 5' }));
    await user.click(screen.getByRole('button', { name: 'Invia selezionate' }));

    await waitFor(() => expect(posted).toEqual([{ requestIds: ['draft-2', 'draft-5'] }]));
    expect(await screen.findByText('2 richieste messe in invio.')).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByRole('checkbox')).toHaveLength(10));
    expect(screen.queryByRole('checkbox', { name: 'Seleziona la richiesta per Broker 2' })).not.toBeInTheDocument();
    expect(screen.getByText('0 selezionate (massimo 10)')).toBeInTheDocument();
  });

  it('names the requests that were skipped and why', async () => {
    const user = userEvent.setup();
    const { renderPage } = openDrafts({
      response: { queued: 1, skipped: [{ id: 'draft-3', reason: 'not_draft' }, { id: 'draft-4', reason: 'profile_not_active' }] },
    });
    renderPage();
    await screen.findAllByRole('checkbox');

    for (const id of [2, 3, 4]) await user.click(screen.getByRole('checkbox', { name: `Seleziona la richiesta per Broker ${id}` }));
    await user.click(screen.getByRole('button', { name: 'Invia selezionate' }));

    expect(await screen.findByText('1 richiesta messa in invio.')).toBeInTheDocument();
    const alert = (await screen.findByText('Alcune richieste non sono state inviate')).closest('[role="alert"]') as HTMLElement;
    expect(within(alert).getByText('Broker 3: era già stata inviata o annullata')).toBeInTheDocument();
    expect(within(alert).getByText('Broker 4: il suo profilo non è attivo')).toBeInTheDocument();
  });

  it('shows an error and keeps the selection when sending fails', async () => {
    const user = userEvent.setup();
    const { renderPage } = openDrafts();
    server.use(http.post(apiUrl('/requests/send'), () => HttpResponse.json({ message: 'boom' }, { status: 500 })));
    renderPage();
    await screen.findAllByRole('checkbox');

    await user.click(checkboxes()[0]!);
    await user.click(screen.getByRole('button', { name: 'Invia selezionate' }));

    expect(await screen.findByText('Non siamo riusciti a inviare le richieste selezionate. Riprova.')).toBeInTheDocument();
    expect(screen.getByText('1 selezionate (massimo 10)')).toBeInTheDocument();
  });

  it('has a "Da inviare" tab with the number of drafts, and does not offer checkboxes in other groups', async () => {
    server.use(...signedInHandlers());
    const { renderPage } = openDrafts();
    renderPage();

    const tab = await screen.findByRole('tab', { name: /Da inviare/ });
    await waitFor(() => expect(tab).toHaveTextContent('12'));
    await screen.findAllByRole('checkbox');
    await userEvent.setup().click(screen.getByRole('tab', { name: /In corso/ }));
    await waitFor(() => expect(screen.queryAllByRole('checkbox')).toHaveLength(0));
  });

  it('offers no checkboxes when the instance sends automatically', async () => {
    const { renderPage } = openDrafts({ sendSelection: 'auto', items: drafts(3) });
    renderPage();

    expect(await screen.findByText('Broker 1')).toBeInTheDocument();
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
    expect(screen.queryByRole('button', { name: 'Invia selezionate' })).not.toBeInTheDocument();
  });
});
