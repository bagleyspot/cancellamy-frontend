import { http, HttpResponse } from 'msw';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { NuisanceComplaintRequest, NuisanceOverviewDto, NuisanceReportInput } from '@/api/types';
import { mockDownloads } from '@/test/downloads';
import { makeNuisanceOverview, makeNuisanceReport } from '@/test/fixtures';
import { apiUrl, signedInHandlers } from '@/test/handlers';
import { renderApp } from '@/test/render';
import { server } from '@/test/server';

function openNuisance(overview: NuisanceOverviewDto = makeNuisanceOverview()) {
  server.use(...signedInHandlers());
  server.use(http.get(apiUrl('/nuisance'), () => HttpResponse.json(overview)));
  return renderApp('/app/telemarketing');
}

const COMPLAINT = {
  text: 'Egregio Garante, segnalo contatti indesiderati.',
  generatedAt: '2026-03-10T10:00:00.000Z',
  pdfUrl: '/api/v1/nuisance/complaint.pdf',
  submitUrl: 'https://www.garanteprivacy.it/segnalazione',
  steps: ['Apri il sito del Garante', 'Allega il PDF'],
};

describe('telemarketing page', () => {
  it('shows the RPO status: not registered, with a link to the requests', async () => {
    openNuisance();

    expect(await screen.findByText('Non ancora iscritto')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Vai alle richieste' })).toHaveAttribute('href', '/app/richieste');
  });

  it('shows the RPO status: registered, effective date and a link to its request', async () => {
    openNuisance(
      makeNuisanceOverview({
        rpo: { registered: true, requestId: 'req-rpo', completedAt: '2026-03-01T10:00:00.000Z', effectiveFrom: '2026-03-16T10:00:00.000Z' },
      }),
    );

    expect(await screen.findByText('Iscritto')).toBeInTheDocument();
    expect(screen.getByText('L’iscrizione è efficace dal 16 marzo 2026.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Vedi la richiesta di iscrizione' })).toHaveAttribute('href', '/app/richieste/req-rpo');
  });

  it('lists the reports with the "RPO attivo al momento" badge and the top callers', async () => {
    openNuisance(
      makeNuisanceOverview({
        reports: [
          makeNuisanceReport({ id: 'n1', rpoActiveAtTime: true }),
          makeNuisanceReport({ id: 'n2', callerNumber: 'anonimo', company: null, summary: 'Vendita di contratti', rpoActiveAtTime: null }),
        ],
        topCallers: [{ callerNumber: '+39 02 1234567', company: 'Energia Facile', count: 3, lastAt: '2026-03-05T09:30:00.000Z' }],
      }),
    );

    expect(await screen.findAllByText('RPO attivo al momento')).toHaveLength(1);
    expect(screen.getByText('Offerta luce e gas')).toBeInTheDocument();
    const table = screen.getByRole('table', { name: 'Chiamanti che ti hanno contattato più spesso' });
    expect(within(table).getByText('+39 02 1234567')).toBeInTheDocument();
    expect(within(table).getByText('3')).toBeInTheDocument();
  });

  it('creates a report with the form values', async () => {
    const user = userEvent.setup();
    const bodies: NuisanceReportInput[] = [];
    let reports = [] as ReturnType<typeof makeNuisanceReport>[];
    openNuisance();
    server.use(
      http.get(apiUrl('/nuisance'), () => HttpResponse.json(makeNuisanceOverview({ reports }))),
      http.post(apiUrl('/nuisance'), async ({ request }) => {
        const body = (await request.json()) as NuisanceReportInput;
        bodies.push(body);
        const created = makeNuisanceReport({ id: 'n-new', callerNumber: body.callerNumber ?? null, company: body.company ?? null });
        reports = [created];
        return HttpResponse.json(created, { status: 201 });
      }),
    );

    await screen.findByText('Segnala un contatto indesiderato');
    await user.selectOptions(screen.getByLabelText('Come ti hanno contattato'), 'sms');
    const when = screen.getByLabelText('Data e ora');
    await user.clear(when);
    await user.type(when, '2026-03-05T09:30');
    await user.type(screen.getByLabelText(/Numero o mittente/), '+39 06 9999999');
    await user.type(screen.getByLabelText(/Società che dichiara/), 'Gas Veloce');
    await user.type(screen.getByLabelText(/Cosa ti hanno detto/), 'Offerta gas');
    await user.selectOptions(screen.getByLabelText('Hai mai dato il consenso a essere contattato?'), 'unknown');
    await user.click(screen.getByRole('button', { name: 'Registra la segnalazione' }));

    expect(await screen.findByText('Segnalazione registrata.')).toBeInTheDocument();
    expect(bodies).toHaveLength(1);
    expect(bodies[0]).toMatchObject({
      profileId: 'profile-1',
      channel: 'sms',
      callerNumber: '+39 06 9999999',
      company: 'Gas Veloce',
      summary: 'Offerta gas',
      consentGiven: 'unknown',
    });
    expect(new Date(bodies[0]?.receivedAt ?? '').toISOString()).toBe(bodies[0]?.receivedAt);
    expect(await screen.findByText('+39 06 9999999')).toBeInTheDocument();
  });

  it('deletes a report after confirmation', async () => {
    const user = userEvent.setup();
    let deleted: string | null = null;
    openNuisance(makeNuisanceOverview({ reports: [makeNuisanceReport({ id: 'n1' })] }));
    server.use(
      http.delete(apiUrl('/nuisance/n1'), () => {
        deleted = 'n1';
        return new HttpResponse(null, { status: 204 });
      }),
    );

    await user.click(await screen.findByRole('button', { name: 'Elimina la segnalazione +39 02 1234567' }));
    const confirm = await screen.findByRole('dialog', { name: 'Eliminare la segnalazione?' });
    await user.click(within(confirm).getByRole('button', { name: 'Elimina' }));

    await waitFor(() => expect(deleted).toBe('n1'));
  });

  it('cannot prepare the complaint without reports', async () => {
    openNuisance();
    expect(await screen.findByRole('button', { name: 'Prepara la segnalazione al Garante' })).toBeDisabled();
    expect(screen.getByText('Registra almeno un contatto indesiderato per preparare la segnalazione.')).toBeInTheDocument();
  });

  it('prepares the complaint and shows text, steps, the PDF download and the filing link', async () => {
    const user = userEvent.setup();
    const files = mockDownloads();
    const bodies: NuisanceComplaintRequest[] = [];
    let pdfProfile: string | null = null;
    openNuisance(makeNuisanceOverview({ reports: [makeNuisanceReport()] }));
    server.use(
      http.post(apiUrl('/nuisance/complaint'), async ({ request }) => {
        bodies.push((await request.json()) as NuisanceComplaintRequest);
        return HttpResponse.json(COMPLAINT);
      }),
      http.get(apiUrl('/nuisance/complaint.pdf'), ({ request }) => {
        pdfProfile = new URL(request.url).searchParams.get('profileId');
        return new HttpResponse('%PDF-1.4', { headers: { 'Content-Type': 'application/pdf' } });
      }),
    );

    await user.click(await screen.findByRole('button', { name: 'Prepara la segnalazione al Garante' }));

    const dialog = await screen.findByRole('dialog', { name: 'Segnalazione preparata' });
    expect(bodies).toEqual([{ profileId: 'profile-1' }]);
    expect(within(dialog).getByText(COMPLAINT.text)).toBeInTheDocument();
    expect(within(dialog).getByText('Allega il PDF')).toBeInTheDocument();
    expect(within(dialog).getByRole('link', { name: /Vai alla pagina per presentare il reclamo/ })).toHaveAttribute('href', COMPLAINT.submitUrl);

    await user.click(within(dialog).getByRole('button', { name: 'Scarica il PDF' }));
    await waitFor(() => expect(files).toEqual(['segnalazione-telemarketing.pdf']));
    expect(pdfProfile).toBe('profile-1');
  });
});
