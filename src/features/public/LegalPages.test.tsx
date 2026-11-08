import { http, HttpResponse } from 'msw';
import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { makeConfig } from '@/test/fixtures';
import { apiUrl } from '@/test/handlers';
import { renderApp } from '@/test/render';
import { server } from '@/test/server';

function withOperator(overrides: Parameters<typeof makeConfig>[0] = {}) {
  server.use(http.get(apiUrl('/config'), () => HttpResponse.json(makeConfig(overrides))));
}

describe('public legal pages', () => {
  it('names the controller, the contact and the attachment retention of this instance in the privacy notice', async () => {
    withOperator({ operatorName: 'Mario Rossi', operatorAddress: 'Via Roma 1, 20100 Milano', supportEmail: 'privacy@mario.example', attachmentRetentionDays: 45 });
    renderApp('/privacy');

    expect(await screen.findByRole('heading', { name: 'Informativa sulla privacy' })).toBeInTheDocument();
    expect(await screen.findByText(/Il titolare del trattamento è Mario Rossi, con recapito in Via Roma 1, 20100 Milano/)).toBeInTheDocument();
    expect(screen.getAllByText(/scrivi a privacy@mario\.example/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/restano scaricabili per 45 giorni/)).toBeInTheDocument();
    for (const heading of ['Quali dati trattiamo', 'Perché li trattiamo e su quale base', 'A chi li comunichiamo', 'Per quanto tempo li conserviamo', 'I tuoi diritti', 'Cookie']) {
      expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument();
    }
    expect(screen.getByText(/garanteprivacy\.it/)).toBeInTheDocument();
  });

  it('does not leave placeholders behind and still warns that a lawyer has to review the text', async () => {
    withOperator({ operatorName: 'Associazione Esempio', operatorAddress: '' });
    renderApp('/privacy');

    await screen.findByText(/Il titolare del trattamento è Associazione Esempio\./);
    expect(screen.queryByText(/DA COMPLETARE/)).not.toBeInTheDocument();
    expect(screen.getByText(/non ancora rivista da un legale/)).toBeInTheDocument();
  });

  it('names the operator in the terms and keeps the key clauses', async () => {
    withOperator({ operatorName: 'Associazione Esempio', operatorAddress: 'Via Roma 1, 20100 Milano', supportEmail: 'aiuto@esempio.example' });
    renderApp('/termini');

    expect(await screen.findByRole('heading', { name: 'Termini di servizio' })).toBeInTheDocument();
    expect(await screen.findByText(/gestita da Associazione Esempio, con recapito in Via Roma 1, 20100 Milano\. Per contattarci: aiuto@esempio\.example/)).toBeInTheDocument();
    for (const heading of ['Delega', 'Nessuna garanzia di risultato', 'Limitazione di responsabilità', 'Modifiche e legge applicabile']) {
      expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument();
    }
    const delega = screen.getByRole('heading', { name: 'Delega' }).closest('section') as HTMLElement;
    expect(within(delega).getByText(/dalla tua casella di posta/)).toBeInTheDocument();
  });
});
