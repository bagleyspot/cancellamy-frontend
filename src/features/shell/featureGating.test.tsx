import { http, HttpResponse } from 'msw';
import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { makeConfig, makeFeatures, makeProfile } from '@/test/fixtures';
import { apiError, apiUrl, signedInHandlers } from '@/test/handlers';
import { renderApp } from '@/test/render';
import { server } from '@/test/server';

const ALL_OFF = makeFeatures({
  senderSmtp: false,
  dossier: false,
  dossierTimestamp: false,
  accessRequests: false,
  breachCheck: false,
  delisting: false,
  leaderboard: false,
  nuisance: false,
});

function withFeatures(features = ALL_OFF) {
  server.use(http.get(apiUrl('/config'), () => HttpResponse.json(makeConfig({ features }))));
}

async function appNav() {
  return (await screen.findAllByRole('navigation', { name: 'Menu dell’area personale' }))[0] as HTMLElement;
}

describe('feature gating: navigation', () => {
  it('shows the new app entries when the features are enabled', async () => {
    server.use(...signedInHandlers());
    renderApp('/app');

    const nav = await appNav();
    expect(await within(nav).findByRole('link', { name: 'Cosa sai di me' })).toHaveAttribute('href', '/app/accesso');
    expect(within(nav).getByRole('link', { name: 'Deindicizzazione' })).toHaveAttribute('href', '/app/deindicizzazione');
    expect(within(nav).getByRole('link', { name: 'Telemarketing' })).toHaveAttribute('href', '/app/telemarketing');
  });

  it('hides the entries of disabled features but keeps the core ones', async () => {
    withFeatures();
    server.use(...signedInHandlers());
    renderApp('/app');

    const nav = await appNav();
    expect(await within(nav).findByRole('link', { name: 'Richieste' })).toBeInTheDocument();
    await waitFor(() => expect(within(nav).queryByRole('link', { name: 'Cosa sai di me' })).not.toBeInTheDocument());
    expect(within(nav).queryByRole('link', { name: 'Deindicizzazione' })).not.toBeInTheDocument();
    expect(within(nav).queryByRole('link', { name: 'Telemarketing' })).not.toBeInTheDocument();
  });

  it('shows the public leaderboard links (header, footer, home) only when the flag is on', async () => {
    const { unmount } = renderApp('/');
    expect((await screen.findAllByRole('link', { name: 'Classifica' })).length).toBeGreaterThanOrEqual(2);
    expect(await screen.findByRole('heading', { name: 'Chi risponde davvero?' })).toBeInTheDocument();
    unmount();

    withFeatures();
    const { queryClient } = renderApp('/');
    await waitFor(() => expect(queryClient.getQueryData(['config'])).toBeDefined());
    expect(screen.queryByRole('link', { name: 'Classifica' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Chi risponde davvero?' })).not.toBeInTheDocument();
  });

  it('only mentions the capabilities that are enabled on "Come funziona"', async () => {
    withFeatures(makeFeatures({ delisting: true, accessRequests: false, nuisance: false, dossier: false, senderSmtp: false, breachCheck: false, leaderboard: false }));
    renderApp('/come-funziona');

    expect(await screen.findByRole('heading', { name: 'Oltre alla cancellazione' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Deindicizzazione' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Telemarketing' })).not.toBeInTheDocument();
  });
});

describe('feature gating: routes and sections', () => {
  it.each([
    ['/app/accesso'],
    ['/app/deindicizzazione'],
    ['/app/telemarketing'],
  ])('%s shows "funzione non disponibile" when the flag is off', async (route) => {
    withFeatures();
    server.use(...signedInHandlers());
    renderApp(route);

    expect(await screen.findByText('Funzione non disponibile')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Torna alla panoramica' })).toHaveAttribute('href', '/app');
  });

  it('/classifica is unavailable when the leaderboard flag is off', async () => {
    withFeatures();
    renderApp('/classifica');
    expect(await screen.findByText('Funzione non disponibile')).toBeInTheDocument();
  });

  it('hides the sender and breach cards on the profile page but keeps the identity card', async () => {
    withFeatures();
    server.use(...signedInHandlers(), http.get(apiUrl('/profiles/profile-1'), () => HttpResponse.json(makeProfile())));
    renderApp('/app/profili/profile-1');

    expect(await screen.findByRole('heading', { name: 'Identità' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Mittente delle email' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Violazioni dei dati' })).not.toBeInTheDocument();
  });

  it('shows the sender and breach cards when enabled', async () => {
    server.use(...signedInHandlers(), http.get(apiUrl('/profiles/profile-1'), () => HttpResponse.json(makeProfile())));
    renderApp('/app/profili/profile-1');

    expect(await screen.findByRole('heading', { name: 'Mittente delle email' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Violazioni dei dati' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Apri la mappa dei dati' })).toHaveAttribute('href', '/app/accesso');
  });

  it('treats a 404 FEATURE_DISABLED answer as "unavailable", not as a crash', async () => {
    server.use(
      ...signedInHandlers(),
      http.get(apiUrl('/profiles/profile-1/data-map'), () => apiError(404, 'FEATURE_DISABLED', 'Funzione disattivata')),
    );
    renderApp('/app/accesso');

    expect(await screen.findByText('Questa funzione non è disponibile su questa installazione.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Riprova' })).not.toBeInTheDocument();
  });

  it('hides the sender card when its endpoint answers FEATURE_DISABLED', async () => {
    server.use(
      ...signedInHandlers(),
      http.get(apiUrl('/profiles/profile-1'), () => HttpResponse.json(makeProfile())),
      http.get(apiUrl('/profiles/profile-1/sender'), () => apiError(404, 'FEATURE_DISABLED', 'off')),
    );
    renderApp('/app/profili/profile-1');

    await screen.findByRole('heading', { name: 'Violazioni dei dati' });
    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Mittente delle email' })).not.toBeInTheDocument());
  });
});
