import { http, HttpResponse } from 'msw';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { RequestDetail } from '@/api/types';
import { makeRequestDetail } from '@/test/fixtures';
import { apiUrl, signedInHandlers } from '@/test/handlers';
import { renderApp } from '@/test/render';
import { server } from '@/test/server';

function showRequest(detail: RequestDetail) {
  server.use(...signedInHandlers(), http.get(apiUrl(`/requests/${detail.id}`), () => HttpResponse.json(detail)));
  return renderApp(`/app/richieste/${detail.id}`);
}

const MANUAL = {
  steps: ['Apri il modulo', 'Incolla il testo'],
  url: 'https://broker.example/privacy',
  prefillText: 'Io sottoscritto Mario Rossi chiedo la cancellazione dei miei dati.',
};

describe('request detail: contextual actions', () => {
  it('shows broker info, timeline and no action buttons for a plain sent request', async () => {
    showRequest(makeRequestDetail({ status: 'sent' }));

    expect(await screen.findByRole('heading', { name: 'Pagine Esempio' })).toBeInTheDocument();
    expect(screen.getByText('Nota legale')).toBeInTheDocument();
    expect(screen.getByText(/Art\. 17 GDPR/)).toBeInTheDocument();
    expect(screen.getByText('Cronologia')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Ho completato l’azione' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Inoltra il documento' })).not.toBeInTheDocument();
    expect(screen.queryByText('Simula una risposta del broker')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Annulla la richiesta' })).toBeInTheDocument();
  });

  it('shows manual instructions, the copyable text and mark-done for manual actions', async () => {
    showRequest(makeRequestDetail({ status: 'action_required', group: 'action_required', actionReason: 'manual_form', channel: 'manual', manual: MANUAL }));

    expect(await screen.findByRole('button', { name: 'Ho completato l’azione' })).toBeInTheDocument();
    expect(screen.getByText('Apri il modulo')).toBeInTheDocument();
    expect(screen.getByText(MANUAL.prefillText)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copia' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Inoltra il documento' })).not.toBeInTheDocument();
  });

  it('marks the action as done through the API', async () => {
    const user = userEvent.setup();
    let called = false;
    showRequest(makeRequestDetail({ status: 'action_required', group: 'action_required', actionReason: 'manual_steps', manual: MANUAL }));
    server.use(
      http.post(apiUrl('/requests/req-1/mark-done'), () => {
        called = true;
        return HttpResponse.json(makeRequestDetail({ status: 'sent' }));
      }),
    );

    await user.click(await screen.findByRole('button', { name: 'Ho completato l’azione' }));

    await screen.findByRole('heading', { name: 'Pagine Esempio' });
    expect(called).toBe(true);
  });

  it('shows the ID upload (and not mark-done) when the broker requests a document', async () => {
    showRequest(makeRequestDetail({ status: 'action_required', group: 'action_required', actionReason: 'id_required', canProvideId: true }));

    expect(await screen.findByRole('button', { name: 'Inoltra il documento' })).toBeInTheDocument();
    expect(screen.getByText(/non lo conserviamo mai/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Ho completato l’azione' })).not.toBeInTheDocument();
  });

  it('rejects an unsupported ID file type before uploading', async () => {
    const user = userEvent.setup({ applyAccept: false });
    showRequest(makeRequestDetail({ status: 'action_required', group: 'action_required', actionReason: 'id_required', canProvideId: true }));

    const input = await screen.findByLabelText('Documento');
    await user.upload(input, new File(['x'], 'foto.gif', { type: 'image/gif' }));
    await user.click(screen.getByRole('button', { name: 'Inoltra il documento' }));

    expect(await screen.findByText('Sono ammessi solo file PDF, JPG o PNG')).toBeInTheDocument();
  });

  it('shows outcome buttons after a reply', async () => {
    showRequest(makeRequestDetail({ status: 'replied', group: 'in_progress' }));

    const heading = await screen.findByRole('heading', { name: 'Com’è andata?' });
    const section = heading.closest('section');
    expect(section).not.toBeNull();
    const scoped = within(section as HTMLElement);
    expect(scoped.getByRole('button', { name: 'Dati cancellati' })).toBeInTheDocument();
    expect(scoped.getByRole('button', { name: 'Richiesta rifiutata' })).toBeInTheDocument();
    expect(scoped.getByRole('button', { name: 'Serve altro da parte mia' })).toBeInTheDocument();
    expect(scoped.getByRole('button', { name: 'Ancora in corso' })).toBeInTheDocument();
  });

  it('offers reminder and escalation only when the API allows them', async () => {
    showRequest(makeRequestDetail({ status: 'overdue', canRemind: true, canEscalate: true }));

    expect(await screen.findByRole('button', { name: 'Invia sollecito' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Prepara il reclamo' })).toBeInTheDocument();
  });

  it('shows the simulate-reply controls only when canSimulateReply is true', async () => {
    const { unmount } = showRequest(makeRequestDetail({ status: 'sent', canSimulateReply: true }));
    expect(await screen.findByText('Simula una risposta del broker')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancellazione confermata' })).toBeInTheDocument();
    unmount();
  });

  it('shows the escalation result: complaint text, steps and the filing link', async () => {
    const user = userEvent.setup();
    showRequest(makeRequestDetail({ status: 'overdue', canEscalate: true }));
    server.use(
      http.post(apiUrl('/requests/req-1/escalate'), () =>
        HttpResponse.json({
          text: 'Egregio Garante, segnalo la mancata risposta.',
          generatedAt: '2026-03-10T10:00:00.000Z',
          pdfUrl: '/api/v1/requests/req-1/complaint.pdf',
          submitUrl: 'https://www.garanteprivacy.it/reclamo',
          steps: ['Apri il sito del Garante', 'Allega il PDF'],
        }),
      ),
      http.get(apiUrl('/requests'), () => HttpResponse.json({ items: [], total: 0, page: 1, limit: 20 })),
    );

    await user.click(await screen.findByRole('button', { name: 'Prepara il reclamo' }));
    const confirm = await screen.findByRole('dialog', { name: 'Preparare il reclamo al Garante?' });
    await user.click(within(confirm).getByRole('button', { name: 'Prepara il reclamo' }));

    const result = await screen.findByRole('dialog', { name: 'Reclamo preparato' });
    expect(within(result).getByText('Egregio Garante, segnalo la mancata risposta.')).toBeInTheDocument();
    expect(within(result).getByText('Allega il PDF')).toBeInTheDocument();
    expect(within(result).getByRole('button', { name: 'Scarica il PDF' })).toBeInTheDocument();
    expect(within(result).getByRole('link', { name: /Vai alla pagina per presentare il reclamo/ })).toHaveAttribute(
      'href',
      'https://www.garanteprivacy.it/reclamo',
    );
  });

  it('marks dry-run messages in the thread', async () => {
    showRequest(
      makeRequestDetail({
        messages: [
          {
            id: 'm1',
            direction: 'out',
            at: '2026-02-01T10:06:00.000Z',
            from: 'noreply@cancellamy.example',
            to: ['privacy@pagine.example'],
            subject: 'Richiesta di cancellazione [CNC-7K2P9Q]',
            text: 'Testo della richiesta',
            classification: null,
            dryRun: true,
            via: 'dry-run',
            attachments: [],
          },
        ],
      }),
    );

    expect(await screen.findByText('Modalità prova: messaggio solo registrato, non inviato')).toBeInTheDocument();
  });

  it('shows a retryable error state when the request cannot be loaded', async () => {
    server.use(...signedInHandlers(), http.get(apiUrl('/requests/req-1'), () => HttpResponse.json({ statusCode: 500, error: 'Internal', message: 'x' }, { status: 500 })));
    renderApp('/app/richieste/req-1');

    expect(await screen.findByText('Non siamo riusciti a caricare la richiesta.', undefined, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Riprova' })).toBeInTheDocument();
  });
});
