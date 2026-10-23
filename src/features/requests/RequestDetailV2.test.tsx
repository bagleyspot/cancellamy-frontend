import { http, HttpResponse } from 'msw';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { AccessFindingsInput, FeatureFlags, MessageDto, RequestDetail } from '@/api/types';
import { mockDownloads } from '@/test/downloads';
import { makeConfig, makeFeatures, makeMessage, makeRequestDetail } from '@/test/fixtures';
import { apiError, apiUrl, signedInHandlers } from '@/test/handlers';
import { renderApp } from '@/test/render';
import { server } from '@/test/server';

function showRequest(detail: RequestDetail, features: Partial<FeatureFlags> = {}) {
  server.use(...signedInHandlers(), http.get(apiUrl(`/requests/${detail.id}`), () => HttpResponse.json(detail)));
  server.use(http.get(apiUrl('/config'), () => HttpResponse.json(makeConfig({ features: makeFeatures(features) }))));
  return renderApp(`/app/richieste/${detail.id}`);
}

const ZIP = (headers: Record<string, string> = {}) => new HttpResponse('PK', { headers: { 'Content-Type': 'application/zip', ...headers } });

describe('request detail: evidence dossier', () => {
  it('offers the timestamp checkbox only when the authority is configured', async () => {
    const { unmount } = showRequest(makeRequestDetail(), { dossierTimestamp: true });
    expect(await screen.findByRole('button', { name: 'Scarica il dossier probatorio' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Aggiungi marca temporale' })).not.toBeChecked();
    unmount();

    showRequest(makeRequestDetail(), { dossierTimestamp: false });
    expect(await screen.findByRole('button', { name: 'Scarica il dossier probatorio' })).toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: 'Aggiungi marca temporale' })).not.toBeInTheDocument();
  });

  it('has no dossier section when the feature is off', async () => {
    showRequest(makeRequestDetail(), { dossier: false, dossierTimestamp: false });

    await screen.findByRole('heading', { name: 'Pagine Esempio' });
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Scarica il dossier probatorio' })).not.toBeInTheDocument());
  });

  it('downloads the ZIP through the authenticated API, with and without the timestamp', async () => {
    const user = userEvent.setup();
    const files = mockDownloads();
    const timestamps: (string | null)[] = [];
    let auth: string | null = null;
    showRequest(makeRequestDetail());
    server.use(
      http.get(apiUrl('/requests/req-1/dossier.zip'), ({ request }) => {
        timestamps.push(new URL(request.url).searchParams.get('timestamp'));
        auth = request.headers.get('Authorization');
        return ZIP();
      }),
    );

    await user.click(await screen.findByRole('button', { name: 'Scarica il dossier probatorio' }));
    await waitFor(() => expect(files).toHaveLength(1));
    await user.click(screen.getByRole('checkbox', { name: 'Aggiungi marca temporale' }));
    await user.click(screen.getByRole('button', { name: 'Scarica il dossier probatorio' }));
    await waitFor(() => expect(files).toHaveLength(2));

    expect(timestamps).toEqual(['false', 'true']);
    expect(files).toEqual(['dossier-CNC-7K2P9Q.zip', 'dossier-CNC-7K2P9Q.zip']);
    expect(auth).toMatch(/^Bearer /);
  });

  it('explains a TIMESTAMP_UNAVAILABLE (502) answer', async () => {
    const user = userEvent.setup();
    mockDownloads();
    showRequest(makeRequestDetail());
    server.use(http.get(apiUrl('/requests/req-1/dossier.zip'), () => apiError(502, 'TIMESTAMP_UNAVAILABLE', 'tsa down')));

    await user.click(await screen.findByRole('checkbox', { name: 'Aggiungi marca temporale' }));
    await user.click(screen.getByRole('button', { name: 'Scarica il dossier probatorio' }));

    expect(await screen.findByText(/Il servizio di marca temporale non risponde/)).toBeInTheDocument();
  });
});

describe('request detail: messages', () => {
  it('labels how each message was delivered', async () => {
    const messages: MessageDto[] = [
      makeMessage({ id: 'm1', direction: 'out', via: 'resend', from: 'noreply@cancellamy.example' }),
      makeMessage({ id: 'm2', direction: 'out', via: 'smtp', from: 'mario@example.it' }),
      makeMessage({ id: 'm3', direction: 'out', via: 'dry-run', dryRun: true }),
      makeMessage({ id: 'm4', direction: 'in', via: 'inbound' }),
    ];
    showRequest(makeRequestDetail({ messages }));

    await screen.findByRole('heading', { name: 'Messaggi' });
    expect(screen.getByText('Inviata da Cancellamy')).toBeInTheDocument();
    expect(screen.getByText('Dalla tua casella')).toBeInTheDocument();
    expect(screen.getByText('Prova', { selector: 'span' })).toBeInTheDocument();
    expect(screen.getByText('Ricevuta')).toBeInTheDocument();
  });

  it('shows "Dati forniti dal broker" for the data_provided classification', async () => {
    showRequest(makeRequestDetail({ messages: [makeMessage({ classification: 'data_provided' })] }));
    expect(await screen.findByText('Dati forniti dal broker')).toBeInTheDocument();
  });
});

describe('request detail: attachments', () => {
  const attachmentUrl = '/requests/req-1/messages/msg-1/attachments/att-1';

  it('offers a download button with the expiry hint for downloadable incoming files', async () => {
    const user = userEvent.setup();
    const files = mockDownloads();
    let auth: string | null = null;
    showRequest(
      makeRequestDetail({
        messages: [
          makeMessage({
            attachments: [{ id: 'att-1', filename: 'dati.pdf', contentType: 'application/pdf', size: 2048, downloadable: true, expiresAt: '2026-04-10T00:00:00.000Z' }],
          }),
        ],
      }),
    );
    server.use(
      http.get(apiUrl(attachmentUrl), ({ request }) => {
        auth = request.headers.get('Authorization');
        return new HttpResponse('%PDF', { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="dati-broker.pdf"' } });
      }),
    );

    const button = await screen.findByRole('button', { name: 'Scarica dati.pdf (2 KB)' });
    expect(screen.getByText('Disponibile fino al 10 aprile 2026')).toBeInTheDocument();
    expect(await screen.findByText('Gli allegati ricevuti restano scaricabili per 30 giorni, poi vengono eliminati.')).toBeInTheDocument();
    await user.click(button);

    await waitFor(() => expect(files).toEqual(['dati-broker.pdf']));
    expect(auth).toMatch(/^Bearer /);
  });

  it('shows a muted note, and no button, when the incoming file is not downloadable (expired or never stored)', async () => {
    showRequest(
      makeRequestDetail({
        messages: [makeMessage({ attachments: [{ id: 'att-1', filename: 'scaduto.pdf', contentType: 'application/pdf', downloadable: false, expiresAt: null }] })],
      }),
    );

    expect(await screen.findByText('scaduto.pdf')).toBeInTheDocument();
    expect(screen.getByText('Non più disponibile per il download.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Scarica scaduto\.pdf/ })).not.toBeInTheDocument();
  });

  it('shows outgoing attachments as plain labels (no download, no note)', async () => {
    showRequest(
      makeRequestDetail({
        messages: [
          makeMessage({
            direction: 'out',
            via: 'resend',
            attachments: [{ id: 'att-9', filename: 'delega.pdf', contentType: 'application/pdf', downloadable: false, expiresAt: null }],
          }),
        ],
      }),
    );

    expect(await screen.findByText('delega.pdf')).toBeInTheDocument();
    expect(screen.queryByText('Non più disponibile per il download.')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Scarica delega\.pdf/ })).not.toBeInTheDocument();
  });

  it('reports a file that expired in the meantime (404)', async () => {
    const user = userEvent.setup();
    mockDownloads();
    showRequest(
      makeRequestDetail({
        messages: [makeMessage({ attachments: [{ id: 'att-1', filename: 'dati.pdf', contentType: 'application/pdf', downloadable: true, expiresAt: '2026-04-10T00:00:00.000Z' }] })],
      }),
    );
    server.use(http.get(apiUrl(attachmentUrl), () => apiError(404, undefined, 'not found')));

    await user.click(await screen.findByRole('button', { name: /Scarica dati\.pdf/ }));

    expect(await screen.findByText('Non siamo riusciti a scaricare l’allegato: potrebbe essere scaduto.')).toBeInTheDocument();
  });
});

describe('request detail: access requests', () => {
  const access = (overrides: Partial<RequestDetail> = {}) =>
    makeRequestDetail({ kind: 'access', status: 'replied', group: 'in_progress', messages: [makeMessage({ classification: 'data_provided' })], ...overrides });

  it('shows the access badge and the findings form, and none of them for erasure requests', async () => {
    const { unmount } = showRequest(access());
    expect(await screen.findByText('Richiesta di accesso')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Cosa ha risposto il broker' })).toBeInTheDocument();
    unmount();

    showRequest(makeRequestDetail());
    await screen.findByRole('heading', { name: 'Pagine Esempio' });
    expect(screen.queryByText('Richiesta di accesso')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Cosa ha risposto il broker' })).not.toBeInTheDocument();
  });

  it('uses access wording for the outcome buttons', async () => {
    showRequest(access());
    expect(await screen.findByRole('button', { name: 'Il broker ha risposto' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Dati cancellati' })).not.toBeInTheDocument();
  });

  it('records the findings: found, categories (Italian labels) and note', async () => {
    const user = userEvent.setup();
    const bodies: AccessFindingsInput[] = [];
    let detail = access();
    showRequest(detail);
    server.use(
      http.get(apiUrl('/requests/req-1'), () => HttpResponse.json(detail)),
      http.put(apiUrl('/requests/req-1/findings'), async ({ request }) => {
        const body = (await request.json()) as AccessFindingsInput;
        bodies.push(body);
        detail = { ...detail, findings: { ...body, note: body.note ?? null, recordedAt: '2026-03-12T10:00:00.000Z' } };
        return HttpResponse.json(detail);
      }),
    );

    await user.click(await screen.findByRole('radio', { name: 'Sì, ha miei dati' }));
    await user.click(screen.getByRole('checkbox', { name: 'Contatti' }));
    await user.click(screen.getByRole('checkbox', { name: 'Attività online' }));
    await user.type(screen.getByLabelText(/Note/), 'Dati ceduti a terzi');
    await user.click(screen.getByRole('button', { name: 'Salva l’esito' }));

    expect(await screen.findByText('Esito salvato.')).toBeInTheDocument();
    expect(bodies).toEqual([{ found: true, categories: ['contacts', 'online_activity'], note: 'Dati ceduti a terzi' }]);
    expect(await screen.findByRole('heading', { name: 'Esito registrato' })).toBeInTheDocument();
    expect(screen.getByText('Il broker ha dati su di te.')).toBeInTheDocument();
    expect(within(screen.getByRole('list', { name: 'Che tipo di dati?' })).getByText('Attività online')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Aggiorna l’esito' })).toBeInTheDocument();
  });

  it('requires an answer and sends no categories when the broker has no data', async () => {
    const user = userEvent.setup();
    const bodies: AccessFindingsInput[] = [];
    const detail = access();
    showRequest(detail);
    server.use(
      http.put(apiUrl('/requests/req-1/findings'), async ({ request }) => {
        const body = (await request.json()) as AccessFindingsInput;
        bodies.push(body);
        return HttpResponse.json({ ...detail, findings: { ...body, note: null, recordedAt: '2026-03-12T10:00:00.000Z' } });
      }),
    );

    await user.click(await screen.findByRole('button', { name: 'Salva l’esito' }));
    expect(await screen.findByText('Indica se il broker ha dati su di te')).toBeInTheDocument();
    expect(bodies).toHaveLength(0);

    await user.click(screen.getByRole('radio', { name: 'Sì, ha miei dati' }));
    await user.click(screen.getByRole('checkbox', { name: 'Indirizzi' }));
    await user.click(screen.getByRole('radio', { name: 'No, non ne ha' }));
    expect(screen.queryByRole('checkbox', { name: 'Indirizzi' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Salva l’esito' }));

    await screen.findByText('Esito salvato.');
    expect(bodies).toEqual([{ found: false, categories: [] }]);
  });

  it('shows the recorded findings read-only when the feature is off', async () => {
    showRequest(
      access({ findings: { found: true, categories: ['financial'], note: 'Dati bancari', recordedAt: '2026-03-12T10:00:00.000Z' } }),
      { accessRequests: false },
    );

    expect(await screen.findByText('Esito registrato')).toBeInTheDocument();
    expect(screen.getByText('Dati finanziari')).toBeInTheDocument();
    expect(screen.getByText('Dati bancari')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /l’esito/ })).not.toBeInTheDocument();
  });
});
