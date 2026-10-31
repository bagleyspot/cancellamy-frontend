import { http, HttpResponse } from 'msw';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CompleteGmailRequest } from '@/api/types';
import { redirectTo } from '@/lib/navigation';
import { makeConfig, makeFeatures, makeProfile, makeSender } from '@/test/fixtures';
import { apiError, apiUrl, signedInHandlers } from '@/test/handlers';
import { renderApp } from '@/test/render';
import { server } from '@/test/server';

vi.mock('@/lib/navigation', () => ({ redirectTo: vi.fn() }));

const profile = makeProfile({ emails: ['mario@gmail.com'] });
const connectedSender = makeSender({ mode: 'gmail', gmail: { email: 'mario@gmail.com' }, verifiedAt: '2026-03-01T10:00:00.000Z' });

function withGoogle(enabled: boolean) {
  server.use(http.get(apiUrl('/config'), () => HttpResponse.json(makeConfig({ features: makeFeatures({ senderGmail: enabled }) }))));
}

function openProfile(sender = makeSender(), { google = true } = {}) {
  server.use(
    ...signedInHandlers(),
    http.get(apiUrl('/profiles/profile-1'), () => HttpResponse.json(profile)),
    http.get(apiUrl('/profiles/profile-1/sender'), () => HttpResponse.json(sender)),
  );
  withGoogle(google);
  return renderApp('/app/profili/profile-1');
}

beforeEach(() => vi.mocked(redirectTo).mockReset());

describe('profile: connect Gmail with Google', () => {
  it('offers the Google button above the SMTP form and sends the browser to the consent URL', async () => {
    const user = userEvent.setup();
    server.use(
      http.post(apiUrl('/profiles/profile-1/sender/gmail/start'), () =>
        HttpResponse.json({ url: 'https://accounts.google.com/o/oauth2/v2/auth?state=abc' }),
      ),
    );
    openProfile();

    await user.click(await screen.findByRole('button', { name: 'Collega con Google' }));

    await waitFor(() => expect(redirectTo).toHaveBeenCalledWith('https://accounts.google.com/o/oauth2/v2/auth?state=abc'));
    expect(screen.getByText(/non leggiamo la tua casella/)).toBeInTheDocument();
    expect(screen.getByLabelText('Server SMTP')).toBeInTheDocument(); // SMTP stays available for other providers
  });

  it('shows a friendly message when the backend cannot start the connection', async () => {
    const user = userEvent.setup();
    server.use(http.post(apiUrl('/profiles/profile-1/sender/gmail/start'), () => apiError(404, 'FEATURE_DISABLED', 'off')));
    openProfile();

    await user.click(await screen.findByRole('button', { name: 'Collega con Google' }));

    expect(await screen.findByText('Questa funzione non è disponibile su questa installazione.')).toBeInTheDocument();
    expect(redirectTo).not.toHaveBeenCalled();
  });

  it('hides the Google option when the instance has no Google credentials', async () => {
    openProfile(makeSender(), { google: false });

    expect(await screen.findByLabelText('Server SMTP')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Collega con Google' })).not.toBeInTheDocument();
  });

  it('shows the connected account, hides the SMTP form and can reconnect', async () => {
    openProfile(connectedSender);

    expect(await screen.findByText('Dal tuo Gmail')).toBeInTheDocument();
    expect(screen.getByText(/Collegato a mario@gmail\.com/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ricollega' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Server SMTP')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Password per le app')).not.toBeInTheDocument();
  });

  it('disconnects after confirmation and goes back to Cancellamy', async () => {
    const user = userEvent.setup();
    let stored = connectedSender;
    server.use(
      http.delete(apiUrl('/profiles/profile-1/sender'), () => {
        stored = makeSender();
        return HttpResponse.json(stored);
      }),
    );
    openProfile(connectedSender);
    server.use(http.get(apiUrl('/profiles/profile-1/sender'), () => HttpResponse.json(stored)));

    await user.click(await screen.findByRole('button', { name: 'Scollega' }));
    await user.click(await screen.findByRole('button', { name: 'Sì, scollega' }));

    expect(await screen.findByText('Gmail scollegato: ora le email partono da Cancellamy.')).toBeInTheDocument();
    expect(await screen.findByText('Da Cancellamy')).toBeInTheDocument();
    expect(await screen.findByLabelText('Server SMTP')).toBeInTheDocument();
  });

  it('still lets the user disconnect a Gmail that was connected before the operator removed the Google credentials', async () => {
    openProfile(connectedSender, { google: false });

    expect(await screen.findByRole('button', { name: 'Scollega' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Ricollega' })).not.toBeInTheDocument();
  });

  it('shows how the last Gmail send failed, so the user knows to reconnect', async () => {
    openProfile({ ...connectedSender, lastError: 'Google access was revoked or expired: connect your Gmail again' });

    expect(await screen.findByText('L’ultimo invio non è riuscito')).toBeInTheDocument();
    expect(screen.getByText(/Google access was revoked or expired/)).toBeInTheDocument();
  });
});

describe('route /app/collega-google', () => {
  function openCallback(query: string, onComplete?: (body: CompleteGmailRequest) => void) {
    server.use(
      ...signedInHandlers(),
      http.get(apiUrl('/profiles/profile-1'), () => HttpResponse.json(profile)),
      http.get(apiUrl('/profiles/profile-1/sender'), () => HttpResponse.json(connectedSender)),
      http.post(apiUrl('/sender/gmail/complete'), async ({ request }) => {
        onComplete?.((await request.json()) as CompleteGmailRequest);
        return HttpResponse.json({ profileId: 'profile-1', sender: connectedSender });
      }),
    );
    withGoogle(true);
    return renderApp(`/app/collega-google${query}`);
  }

  it('completes the connection once with the code and state from Google and lands on the profile', async () => {
    const bodies: CompleteGmailRequest[] = [];
    openCallback('?code=4%2F0abc&state=v1%3Aopaque', (body) => bodies.push(body));

    expect(await screen.findByText('Dal tuo Gmail')).toBeInTheDocument();
    expect(await screen.findByText(/Collegato a mario@gmail\.com/)).toBeInTheDocument();
    expect(bodies).toEqual([{ code: '4/0abc', state: 'v1:opaque' }]);
  });

  it('explains that the user cancelled on Google and sends nothing to the backend', async () => {
    const bodies: CompleteGmailRequest[] = [];
    openCallback('?error=access_denied&state=x', (body) => bodies.push(body));

    expect(await screen.findByText(/Hai annullato il collegamento con Google/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Vai ai profili' })).toHaveAttribute('href', '/app/profili');
    expect(bodies).toHaveLength(0);
  });

  it('rejects a visit without code or state', async () => {
    const bodies: CompleteGmailRequest[] = [];
    openCallback('', (body) => bodies.push(body));

    expect(await screen.findByText(/Il collegamento non è valido o è scaduto/)).toBeInTheDocument();
    expect(bodies).toHaveLength(0);
  });

  it('shows a friendly error when the backend refuses the connection', async () => {
    server.use(
      ...signedInHandlers(),
      http.post(apiUrl('/sender/gmail/complete'), () => apiError(400, 'GMAIL_ADDRESS_NOT_IN_PROFILE', 'not in profile')),
    );
    withGoogle(true);
    renderApp('/app/collega-google?code=c&state=s');

    expect(await screen.findByText('Collegamento non riuscito')).toBeInTheDocument();
    expect(screen.getByText(/non corrisponde a nessun indirizzo email di questo profilo/)).toBeInTheDocument();
  });
});
