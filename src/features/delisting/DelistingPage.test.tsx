import { http, HttpResponse } from 'msw';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { DelistingDto, DelistingInput, DelistingPatch, DelistingStatus } from '@/api/types';
import { makeDelisting, makeDelistingGuide, paginated } from '@/test/fixtures';
import { apiUrl, signedInHandlers } from '@/test/handlers';
import { renderApp } from '@/test/render';
import { server } from '@/test/server';

function openDelistings(items: DelistingDto[], extra: Parameters<typeof server.use> = []) {
  server.use(
    ...signedInHandlers(),
    http.get(apiUrl('/delistings'), () => HttpResponse.json(paginated(items))),
    http.get(apiUrl('/delistings/:id'), ({ params }) => HttpResponse.json(items.find((item) => item.id === params.id) ?? items[0])),
    http.get(apiUrl('/delistings/:id/guide'), () => HttpResponse.json(makeDelistingGuide())),
  );
  // a later server.use() call takes precedence over earlier ones
  server.use(...extra);
  return renderApp('/app/deindicizzazione');
}

async function openDetail(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('button', { name: /Apri la pratica per/ }));
  return screen.findByRole('dialog', { name: 'Pratica di deindicizzazione' });
}

function actionLabels(dialog: HTMLElement): string[] {
  const section = within(dialog).getByRole('heading', { name: 'Aggiorna la pratica' }).closest('section') as HTMLElement;
  return within(section)
    .getAllByRole('button')
    .map((button) => button.textContent ?? '')
    .filter((label) => label !== 'Salva la nota');
}

describe('delisting page', () => {
  it('lists the requests with status, URL and a follow-up date', async () => {
    openDelistings([
      makeDelisting({ id: 'd1', status: 'submitted', submittedAt: '2026-03-02T10:00:00.000Z', followUpAt: '2026-04-01T10:00:00.000Z' }),
    ]);

    const row = await screen.findByRole('button', { name: /Apri la pratica per https:\/\/news\.example\/articolo-vecchio/ });
    expect(within(row).getByText('Inviata')).toBeInTheDocument();
    expect(within(row).getByText(/Verifica entro il 1 aprile 2026/)).toBeInTheDocument();
  });

  it('filters by status through the API', async () => {
    const user = userEvent.setup();
    const queries: URLSearchParams[] = [];
    openDelistings([makeDelisting()], [
      http.get(apiUrl('/delistings'), ({ request }) => {
        queries.push(new URL(request.url).searchParams);
        return HttpResponse.json(paginated([makeDelisting()]));
      }),
    ]);

    await screen.findByRole('button', { name: /Apri la pratica per/ });
    await user.selectOptions(screen.getByLabelText('Stato'), 'denied');

    await screen.findByRole('button', { name: /Apri la pratica per/ });
    expect(queries.at(-1)?.get('status')).toBe('denied');
    expect(queries.at(-1)?.get('profileId')).toBe('profile-1');
  });

  it('shows an empty state with no requests', async () => {
    openDelistings([]);
    expect(await screen.findByText('Nessuna pratica')).toBeInTheDocument();
  });

  it.each<[DelistingStatus, string[]]>([
    ['to_submit', ['L’ho inviata', 'Annulla la pratica']],
    ['submitted', ['Accolta', 'Accolta in parte', 'Respinta', 'Annulla la pratica']],
    ['denied', ['Presenta ricorso']],
    ['partially_approved', ['Presenta ricorso']],
    ['appealed', ['Accolta', 'Accolta in parte', 'Respinta', 'Annulla la pratica']],
  ])('from %s offers only the allowed actions', async (status, expected) => {
    const user = userEvent.setup();
    openDelistings([makeDelisting({ status })]);

    const dialog = await openDetail(user);
    await within(dialog).findByRole('heading', { name: 'Aggiorna la pratica' });

    expect(actionLabels(dialog)).toEqual(expected);
  });

  it.each<DelistingStatus>(['approved', 'cancelled'])('a %s request has no actions left', async (status) => {
    const user = userEvent.setup();
    openDelistings([makeDelisting({ status })]);

    const dialog = await openDetail(user);

    expect(await within(dialog).findByText('La pratica è chiusa: non ci sono altre azioni.')).toBeInTheDocument();
    expect(actionLabels(dialog)).toEqual([]);
  });

  it('shows the guide: steps, copyable statement, form link and tips', async () => {
    const user = userEvent.setup();
    openDelistings([makeDelisting()]);

    const dialog = await openDetail(user);

    expect(await within(dialog).findByText('Come fare su Google')).toBeInTheDocument();
    expect(within(dialog).getByText('Incolla il testo')).toBeInTheDocument();
    expect(within(dialog).getByText('Chiedo la rimozione di questo risultato perché non è più attuale.')).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Copia' })).toBeInTheDocument();
    expect(within(dialog).getByRole('link', { name: /Apri il modulo/ })).toHaveAttribute('href', 'https://reportcontent.google.com/forms/rtbf');
    expect(within(dialog).getByText('Indica l’indirizzo esatto della pagina')).toBeInTheDocument();
  });

  it('says there is no online form when the guide has no formUrl', async () => {
    const user = userEvent.setup();
    openDelistings([makeDelisting({ engine: 'other' })], [
      http.get(apiUrl('/delistings/:id/guide'), () => HttpResponse.json(makeDelistingGuide({ engineName: 'Altro motore', formUrl: null }))),
    ]);

    const dialog = await openDetail(user);

    expect(await within(dialog).findByText('Per questo motore non c’è un modulo online: segui i passaggi.')).toBeInTheDocument();
    expect(within(dialog).queryByRole('link', { name: /Apri il modulo/ })).not.toBeInTheDocument();
  });

  it('marks the request as submitted with the note and shows the follow-up date', async () => {
    const user = userEvent.setup();
    const patches: DelistingPatch[] = [];
    let current = makeDelisting({ id: 'd1' });
    openDelistings([current], [
      http.get(apiUrl('/delistings/d1'), () => HttpResponse.json(current)),
      http.patch(apiUrl('/delistings/d1'), async ({ request }) => {
        const patch = (await request.json()) as DelistingPatch;
        patches.push(patch);
        current = { ...current, ...patch, status: patch.status ?? current.status, submittedAt: '2026-03-02T10:00:00.000Z', followUpAt: '2026-04-01T10:00:00.000Z' } as DelistingDto;
        return HttpResponse.json(current);
      }),
    ]);

    const dialog = await openDetail(user);
    await user.type(await within(dialog).findByLabelText(/Nota/), 'Modulo inviato oggi');
    await user.click(within(dialog).getByRole('button', { name: 'L’ho inviata' }));

    expect(await within(dialog).findByText(/Ti avvisiamo il 1 aprile 2026/)).toBeInTheDocument();
    expect(patches).toEqual([{ status: 'submitted', note: 'Modulo inviato oggi' }]);
    expect(actionLabels(dialog)).toEqual(['Accolta', 'Accolta in parte', 'Respinta', 'Annulla la pratica']);
  });

  it('asks for confirmation before cancelling and before deleting', async () => {
    const user = userEvent.setup();
    const patches: DelistingPatch[] = [];
    let deleted = false;
    let current = makeDelisting({ id: 'd1' });
    openDelistings([current], [
      http.get(apiUrl('/delistings/d1'), () => HttpResponse.json(current)),
      http.patch(apiUrl('/delistings/d1'), async ({ request }) => {
        patches.push((await request.json()) as DelistingPatch);
        current = makeDelisting({ id: 'd1', status: 'cancelled' });
        return HttpResponse.json(current);
      }),
      http.delete(apiUrl('/delistings/d1'), () => {
        deleted = true;
        return new HttpResponse(null, { status: 204 });
      }),
    ]);

    const dialog = await openDetail(user);
    await user.click(await within(dialog).findByRole('button', { name: 'Annulla la pratica' }));
    expect(patches).toHaveLength(0);
    const cancelConfirm = await screen.findByRole('dialog', { name: 'Annullare la pratica?' });
    await user.click(within(cancelConfirm).getByRole('button', { name: 'Sì, annulla' }));
    await screen.findByText('La pratica è chiusa: non ci sono altre azioni.');
    expect(patches).toEqual([{ status: 'cancelled' }]);

    await user.click(within(dialog).getByRole('button', { name: 'Elimina la pratica' }));
    const deleteConfirm = await screen.findByRole('dialog', { name: 'Eliminare la pratica?' });
    await user.click(within(deleteConfirm).getByRole('button', { name: 'Elimina definitivamente' }));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Pratica di deindicizzazione' })).not.toBeInTheDocument());
    expect(deleted).toBe(true);
  });

  it('creates a request (URL must be http/https) and opens its detail', async () => {
    const user = userEvent.setup();
    const bodies: DelistingInput[] = [];
    openDelistings([], [
      http.post(apiUrl('/delistings'), async ({ request }) => {
        bodies.push((await request.json()) as DelistingInput);
        return HttpResponse.json(makeDelisting({ id: 'd-new' }), { status: 201 });
      }),
      http.get(apiUrl('/delistings/d-new'), () => HttpResponse.json(makeDelisting({ id: 'd-new' }))),
    ]);

    await user.click((await screen.findAllByRole('button', { name: 'Nuova richiesta' }))[0] as HTMLElement);
    await user.type(screen.getByLabelText(/Indirizzo della pagina/), 'news.example/articolo');
    await user.click(screen.getByRole('button', { name: 'Crea la pratica' }));
    expect(await screen.findByText('Inserisci un indirizzo che inizi con http:// o https://')).toBeInTheDocument();
    expect(bodies).toHaveLength(0);

    await user.clear(screen.getByLabelText(/Indirizzo della pagina/));
    await user.type(screen.getByLabelText(/Indirizzo della pagina/), 'https://news.example/articolo');
    await user.selectOptions(screen.getByLabelText('Motore di ricerca'), 'bing');
    await user.selectOptions(screen.getByLabelText('Motivo'), 'inaccurate');
    await user.click(screen.getByRole('button', { name: 'Crea la pratica' }));

    expect(await screen.findByRole('dialog', { name: 'Pratica di deindicizzazione' })).toBeInTheDocument();
    expect(bodies).toEqual([
      { profileId: 'profile-1', engine: 'bing', url: 'https://news.example/articolo', reason: 'inaccurate', searchQuery: 'Mario Rossi' },
    ]);
  });
});
