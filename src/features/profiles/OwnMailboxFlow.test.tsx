import { http, HttpResponse } from 'msw';
import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { makeConfig, makeProfile } from '@/test/fixtures';
import { apiUrl, signedInHandlers } from '@/test/handlers';
import { renderApp } from '@/test/render';
import { server } from '@/test/server';

function openProfile(profile = makeProfile({ status: 'ready', authorizationRequired: false, authorization: null })) {
  server.use(
    ...signedInHandlers(),
    http.get(apiUrl('/profiles/profile-1'), () => HttpResponse.json(profile)),
    http.get(apiUrl('/profiles'), () => HttpResponse.json([profile])),
  );
  return renderApp('/app/profili/profile-1');
}

describe('profiles that send from their own mailbox need no delega', () => {
  it('goes straight to the summary: three steps and no authorization card', async () => {
    openProfile();

    const stepper = await screen.findByRole('navigation', { name: 'Passi della configurazione' });
    expect(within(stepper).queryByText('Autorizzazione')).not.toBeInTheDocument();
    expect(within(stepper).getAllByRole('listitem')).toHaveLength(3);
    expect(within(stepper).getByText('Riepilogo e attivazione')).toBeInTheDocument();
    expect(screen.queryByText('Non ancora firmata')).not.toBeInTheDocument();
  });

  it('keeps the four steps and the authorization card when the delega is required', async () => {
    openProfile(makeProfile({ status: 'draft', authorizationRequired: true, authorization: null }));

    const stepper = await screen.findByRole('navigation', { name: 'Passi della configurazione' });
    expect(within(stepper).getAllByRole('listitem')).toHaveLength(4);
    expect(await screen.findByText('Non ancora firmata')).toBeInTheDocument();
  });

  it('shows three steps in the new-profile wizard when the instance runs in mailbox mode', async () => {
    server.use(...signedInHandlers(), http.get(apiUrl('/profiles'), () => HttpResponse.json([])), http.get(apiUrl('/config'), () => HttpResponse.json(makeConfig({ mailMode: 'mailbox' }))));
    renderApp('/app/profili/nuovo');

    const stepper = await screen.findByRole('navigation', { name: 'Passi della configurazione' });
    await waitFor(() => expect(within(stepper).getAllByRole('listitem')).toHaveLength(3));
    expect(screen.getAllByText('Passo 1 di 3').length).toBeGreaterThan(0);
  });
});
