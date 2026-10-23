import { http, HttpResponse } from 'msw';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { ProfileInput } from '@/api/types';
import { makeProfile, makeUser } from '@/test/fixtures';
import { TEST_ACCESS_TOKEN, apiUrl } from '@/test/handlers';
import { renderApp } from '@/test/render';
import { server } from '@/test/server';

function signedInAs(maxProfiles = 4, existing = 0) {
  server.use(
    http.post(apiUrl('/auth/refresh'), () => HttpResponse.json({ accessToken: TEST_ACCESS_TOKEN })),
    http.get(apiUrl('/me'), () => HttpResponse.json(makeUser({ maxProfiles }))),
    http.get(apiUrl('/profiles'), () => HttpResponse.json(Array.from({ length: existing }, (_, index) => makeProfile({ id: `p${index}` })))),
  );
}

describe('onboarding wizard: data steps', () => {
  it('blocks step 1 until name fields are filled', async () => {
    signedInAs();
    const user = userEvent.setup();
    renderApp('/app/profili/nuovo');

    await user.click(await screen.findByRole('button', { name: 'Avanti' }));

    expect(await screen.findByText('Inserisci il nome')).toBeInTheDocument();
    expect(screen.getByText('Inserisci il cognome')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Dati personali' })).toBeInTheDocument();
  });

  it('creates the profile after step 2 and sends contract-shaped data', async () => {
    signedInAs();
    const created: ProfileInput[] = [];
    server.use(
      http.post(apiUrl('/profiles'), async ({ request }) => {
        const body = (await request.json()) as ProfileInput;
        created.push(body);
        return HttpResponse.json(makeProfile({ id: 'new-1', status: 'draft', authorization: null, ...body }), { status: 201 });
      }),
      http.get(apiUrl('/profiles/new-1'), () => HttpResponse.json(makeProfile({ id: 'new-1', status: 'draft', authorization: null }))),
      http.get(apiUrl('/profiles/new-1/authorization/text'), () => HttpResponse.json({ version: '1.0', text: 'Testo della delega' })),
    );
    const user = userEvent.setup();
    renderApp('/app/profili/nuovo');

    await user.type(await screen.findByLabelText('Nome'), 'Mario');
    await user.type(screen.getByLabelText('Cognome'), 'Rossi');
    await user.click(screen.getByRole('button', { name: 'Avanti' }));

    const email = await screen.findByLabelText('Email 1');
    await user.type(email, 'mario@example.it');
    await user.click(screen.getByRole('button', { name: 'Avanti' }));

    await waitFor(() => expect(created).toHaveLength(1));
    expect(created[0]).toMatchObject({ firstName: 'Mario', lastName: 'Rossi', emails: ['mario@example.it'], phones: [], addresses: [], aliases: [] });
    expect(await screen.findByText('Testo della delega')).toBeInTheDocument();
  });

  it('flags an invalid email in step 2 and does not create the profile', async () => {
    signedInAs();
    let calls = 0;
    server.use(
      http.post(apiUrl('/profiles'), () => {
        calls += 1;
        return HttpResponse.json(makeProfile(), { status: 201 });
      }),
    );
    const user = userEvent.setup();
    renderApp('/app/profili/nuovo');

    await user.type(await screen.findByLabelText('Nome'), 'Mario');
    await user.type(screen.getByLabelText('Cognome'), 'Rossi');
    await user.click(screen.getByRole('button', { name: 'Avanti' }));
    await user.type(await screen.findByLabelText('Email 1'), 'non-valida');
    await user.click(screen.getByRole('button', { name: 'Avanti' }));

    expect(await screen.findByText('Inserisci un indirizzo email valido')).toBeInTheDocument();
    expect(calls).toBe(0);
  });

  it('enforces the maximum of 5 emails by hiding the add button', async () => {
    signedInAs();
    const user = userEvent.setup();
    renderApp('/app/profili/nuovo');

    await user.type(await screen.findByLabelText('Nome'), 'Mario');
    await user.type(screen.getByLabelText('Cognome'), 'Rossi');
    await user.click(screen.getByRole('button', { name: 'Avanti' }));
    await screen.findByLabelText('Email 1');

    for (let index = 0; index < 4; index += 1) {
      await user.click(screen.getByRole('button', { name: /^Aggiungi email$/i }));
    }
    expect(screen.getAllByLabelText(/^Email \d$/)).toHaveLength(5);
    expect(screen.queryByRole('button', { name: /^Aggiungi email$/i })).not.toBeInTheDocument();
  });

  it('tells the user when the profile limit is reached', async () => {
    signedInAs(1, 1);
    renderApp('/app/profili/nuovo');

    expect(await screen.findByText('Hai raggiunto il numero massimo di profili.')).toBeInTheDocument();
    expect(screen.queryByLabelText('Nome')).not.toBeInTheDocument();
  });
});
