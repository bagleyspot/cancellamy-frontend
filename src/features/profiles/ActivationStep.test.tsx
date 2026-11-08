import { http, HttpResponse } from 'msw';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { makeConfig, makeProfile } from '@/test/fixtures';
import { apiUrl } from '@/test/handlers';
import { renderWithProviders } from '@/test/render';
import { server } from '@/test/server';
import { ActivationStep } from './ActivationStep';

const profile = makeProfile({ status: 'ready' });

describe('activation: what the user is told', () => {
  it('says nothing was sent and links to the drafts when the user chooses what to send', async () => {
    server.use(http.get(apiUrl('/config'), () => HttpResponse.json(makeConfig({ sendSelection: 'manual', sendSelectionMax: 10 }))));
    renderWithProviders(<ActivationStep profile={profile} result={{ emailRequests: 336, manualActions: 7, dailyEmailBatchSize: 5, awaitingSelection: true }} onActivated={() => undefined} />);

    expect(await screen.findByText('Sono pronte 336 richieste email: non ne è stata inviata nessuna.')).toBeInTheDocument();
    expect(await screen.findByText('Scegli tu quali inviare')).toBeInTheDocument();
    expect(screen.getByText(/al massimo 10 per volta/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Scegli cosa inviare' })).toHaveAttribute('href', '/app/richieste?group=to_send');
    expect(screen.queryByText(/Invio a scaglioni/)).not.toBeInTheDocument();
  });

  it('keeps the staggered-sending explanation when requests are queued automatically', async () => {
    renderWithProviders(<ActivationStep profile={profile} result={{ emailRequests: 340, manualActions: 7, dailyEmailBatchSize: 5 }} onActivated={() => undefined} />);

    expect(await screen.findByText('340 richieste sono state messe in coda per l’invio via email.')).toBeInTheDocument();
    expect(screen.getByText(/Invio a scaglioni: massimo 5 richieste al giorno/)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Scegli cosa inviare' })).not.toBeInTheDocument();
  });

  it('before activating, tells the user nothing will be sent by itself in manual mode', async () => {
    server.use(http.get(apiUrl('/config'), () => HttpResponse.json(makeConfig({ sendSelection: 'manual', sendSelectionMax: 10 }))));
    renderWithProviders(<ActivationStep profile={profile} result={null} onActivated={() => undefined} />);

    expect(await screen.findByText(/attivando il profilo non parte nessuna email/)).toBeInTheDocument();
    expect(screen.queryByText(/Invio equo e scaglionato/)).not.toBeInTheDocument();
  });
});
