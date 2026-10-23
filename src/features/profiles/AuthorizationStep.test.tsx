import { http, HttpResponse } from 'msw';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { SignAuthorizationRequest } from '@/api/types';
import { makeAuthorizationText, makeProfile } from '@/test/fixtures';
import { apiUrl } from '@/test/handlers';
import { renderWithProviders } from '@/test/render';
import { server } from '@/test/server';
import { AuthorizationStep } from './AuthorizationStep';

const profile = makeProfile({ id: 'profile-9', status: 'draft', authorization: null });

function setup(onSigned = vi.fn()) {
  const signed: SignAuthorizationRequest[] = [];
  server.use(
    http.get(apiUrl('/profiles/profile-9/authorization/text'), () => HttpResponse.json(makeAuthorizationText())),
    http.post(apiUrl('/profiles/profile-9/authorization'), async ({ request }) => {
      signed.push((await request.json()) as SignAuthorizationRequest);
      return HttpResponse.json(
        { id: 'a1', signedAt: '2026-03-01T10:00:00.000Z', signatureName: 'Mario Rossi', textVersion: '1.0', revokedAt: null },
        { status: 201 },
      );
    }),
  );
  renderWithProviders(<AuthorizationStep profile={profile} onSigned={onSigned} />);
  return { signed, onSigned };
}

describe('onboarding: authorization step', () => {
  it('shows the delega text returned by the API', async () => {
    setup();
    expect(await screen.findByText(/autorizzo Cancellamy a inviare richieste/)).toBeInTheDocument();
  });

  it('rejects a signature that does not match the profile name', async () => {
    const user = userEvent.setup();
    const { signed } = setup();
    await screen.findByText(/autorizzo Cancellamy/);

    await user.type(screen.getByLabelText('Firma (nome e cognome)'), 'Mario Bianchi');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Firma e continua' }));

    expect(await screen.findByText('La firma deve coincidere con nome e cognome del profilo')).toBeInTheDocument();
    expect(signed).toHaveLength(0);
  });

  it('requires accepting the authorization', async () => {
    const user = userEvent.setup();
    const { signed } = setup();
    await screen.findByText(/autorizzo Cancellamy/);

    await user.type(screen.getByLabelText('Firma (nome e cognome)'), 'Mario Rossi');
    await user.click(screen.getByRole('button', { name: 'Firma e continua' }));

    expect(await screen.findByText('Devi accettare l’autorizzazione per procedere')).toBeInTheDocument();
    expect(signed).toHaveLength(0);
  });

  it('accepts the name case-insensitively and with surrounding spaces, then signs', async () => {
    const user = userEvent.setup();
    const { signed, onSigned } = setup();
    await screen.findByText(/autorizzo Cancellamy/);

    await user.type(screen.getByLabelText('Firma (nome e cognome)'), '  mario ROSSI ');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Firma e continua' }));

    await waitFor(() => expect(onSigned).toHaveBeenCalledTimes(1));
    expect(signed).toEqual([{ signatureName: 'mario ROSSI', accepted: true }]);
  });
});
