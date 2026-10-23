import { http, HttpResponse } from 'msw';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { ConfirmCodeRequest, IdentityDto, SendCodeRequest } from '@/api/types';
import { makeIdentity, makeProfile } from '@/test/fixtures';
import { apiError, apiUrl, signedInHandlers } from '@/test/handlers';
import { renderApp } from '@/test/render';
import { server } from '@/test/server';

function openProfile(identity: IdentityDto) {
  server.use(
    ...signedInHandlers(),
    http.get(apiUrl('/profiles/profile-1'), () => HttpResponse.json(makeProfile({ identityVerified: identity.verified }))),
    http.get(apiUrl('/profiles/profile-1/identity'), () => HttpResponse.json(identity)),
  );
  return renderApp('/app/profili/profile-1');
}

describe('profile: identity card', () => {
  it('lists the contacts with a verified badge and a "Verifica" button only for unverified ones', async () => {
    openProfile(
      makeIdentity({
        contacts: [
          { type: 'email', value: 'mario@example.it', verified: true, verifiedAt: '2026-03-01T10:00:00.000Z' },
          { type: 'email', value: 'altro@example.it', verified: false, verifiedAt: null },
        ],
      }),
    );

    expect(await screen.findByText('altro@example.it')).toBeInTheDocument();
    expect(screen.getByText('Da verificare')).toBeInTheDocument();
    expect(screen.getAllByText(/^Verificato/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('button', { name: 'Verifica altro@example.it' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Verifica mario@example.it' })).not.toBeInTheDocument();
    expect(screen.getByText(/Serve per “Cosa sai di me” e per il controllo delle violazioni/)).toBeInTheDocument();
  });

  it('shows phone contacts only when the instance can verify them', async () => {
    const contacts = [
      { type: 'email', value: 'mario@example.it', verified: true, verifiedAt: '2026-03-01T10:00:00.000Z' },
      { type: 'phone', value: '+39 333 1234567', verified: false, verifiedAt: null },
    ] as const;
    const { unmount } = openProfile(makeIdentity({ requiresPhone: false, contacts: [...contacts] }));
    await screen.findByText('mario@example.it');
    expect(screen.queryByText('+39 333 1234567')).not.toBeInTheDocument();
    unmount();

    openProfile(makeIdentity({ requiresPhone: true, contacts: [...contacts] }));
    expect(await screen.findByText('+39 333 1234567')).toBeInTheDocument();
    expect(screen.getByText('I telefoni si verificano con un SMS.')).toBeInTheDocument();
  });

  it('sends a code, then confirms it and refreshes the verified state', async () => {
    const user = userEvent.setup();
    const sent: SendCodeRequest[] = [];
    const confirmed: ConfirmCodeRequest[] = [];
    let verified = false;
    openProfile(makeIdentity());
    server.use(
      http.get(apiUrl('/profiles/profile-1/identity'), () =>
        HttpResponse.json(
          makeIdentity({
            verified,
            contacts: [{ type: 'email', value: 'mario@example.it', verified, verifiedAt: verified ? '2026-03-02T10:00:00.000Z' : null }],
          }),
        ),
      ),
      http.post(apiUrl('/profiles/profile-1/identity/send-code'), async ({ request }) => {
        sent.push((await request.json()) as SendCodeRequest);
        return new HttpResponse(null, { status: 204 });
      }),
      http.post(apiUrl('/profiles/profile-1/identity/confirm'), async ({ request }) => {
        confirmed.push((await request.json()) as ConfirmCodeRequest);
        verified = true;
        return HttpResponse.json(makeIdentity({ verified: true, contacts: [{ type: 'email', value: 'mario@example.it', verified: true, verifiedAt: '2026-03-02T10:00:00.000Z' }] }));
      }),
    );

    await user.click(await screen.findByRole('button', { name: 'Verifica mario@example.it' }));
    expect(await screen.findByText('Codice inviato a mario@example.it. È valido 15 minuti.')).toBeInTheDocument();
    expect(sent).toEqual([{ type: 'email', value: 'mario@example.it' }]);

    await user.type(screen.getByLabelText('Codice per mario@example.it'), '123456');
    await user.click(screen.getByRole('button', { name: 'Conferma' }));

    expect(await screen.findByText('Identità verificata')).toBeInTheDocument();
    expect(confirmed).toEqual([{ type: 'email', value: 'mario@example.it', code: '123456' }]);
    expect(screen.queryByLabelText('Codice per mario@example.it')).not.toBeInTheDocument();
  });

  it('rejects a code that is not 6 digits without calling the API', async () => {
    const user = userEvent.setup();
    let called = false;
    openProfile(makeIdentity());
    server.use(
      http.post(apiUrl('/profiles/profile-1/identity/send-code'), () => new HttpResponse(null, { status: 204 })),
      http.post(apiUrl('/profiles/profile-1/identity/confirm'), () => {
        called = true;
        return HttpResponse.json(makeIdentity());
      }),
    );

    await user.click(await screen.findByRole('button', { name: 'Verifica mario@example.it' }));
    await user.type(await screen.findByLabelText('Codice per mario@example.it'), '12ab');
    await user.click(screen.getByRole('button', { name: 'Conferma' }));

    expect(await screen.findByText('Inserisci le 6 cifre del codice')).toBeInTheDocument();
    expect(called).toBe(false);
  });

  it('shows a friendly message for a wrong code', async () => {
    const user = userEvent.setup();
    openProfile(makeIdentity());
    server.use(
      http.post(apiUrl('/profiles/profile-1/identity/send-code'), () => new HttpResponse(null, { status: 204 })),
      http.post(apiUrl('/profiles/profile-1/identity/confirm'), () => apiError(400, 'VERIFICATION_CODE_INVALID', 'codice errato')),
    );

    await user.click(await screen.findByRole('button', { name: 'Verifica mario@example.it' }));
    await user.type(await screen.findByLabelText('Codice per mario@example.it'), '000000');
    await user.click(screen.getByRole('button', { name: 'Conferma' }));

    expect(await screen.findByText(/Il codice non è corretto o è scaduto/)).toBeInTheDocument();
    expect(screen.getByLabelText('Codice per mario@example.it')).toBeInTheDocument();
  });

  it('shows the rate-limit message when too many codes were requested', async () => {
    const user = userEvent.setup();
    openProfile(makeIdentity());
    server.use(http.post(apiUrl('/profiles/profile-1/identity/send-code'), () => apiError(429, 'VERIFICATION_RATE_LIMITED', 'troppi codici')));

    await user.click(await screen.findByRole('button', { name: 'Verifica mario@example.it' }));

    const alert = await screen.findByRole('alert');
    expect(within(alert).getByText(/Hai richiesto troppi codici ravvicinati/)).toBeInTheDocument();
    expect(screen.queryByLabelText('Codice per mario@example.it')).not.toBeInTheDocument();
  });
});
