import { http, HttpResponse } from 'msw';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { getAccessToken } from '@/api/http';
import { TEST_PASSWORD, makeUser } from '@/test/fixtures';
import { TEST_ACCESS_TOKEN, apiUrl } from '@/test/handlers';
import { renderApp } from '@/test/render';
import { server } from '@/test/server';

describe('login flow', () => {
  it('signs the user in and lands on the dashboard', async () => {
    const user = userEvent.setup();
    renderApp('/accedi');

    await user.type(await screen.findByLabelText('Email'), 'mario@example.it');
    await user.type(screen.getByLabelText('Password'), TEST_PASSWORD);
    await user.click(screen.getByRole('button', { name: 'Accedi' }));

    expect(await screen.findByRole('heading', { name: 'Panoramica' })).toBeInTheDocument();
    expect(getAccessToken()).toBe(TEST_ACCESS_TOKEN);
  });

  it('shows an Italian error and stays on the page when credentials are wrong', async () => {
    const user = userEvent.setup();
    renderApp('/accedi');

    await user.type(await screen.findByLabelText('Email'), 'mario@example.it');
    await user.type(screen.getByLabelText('Password'), 'sbagliata-sbagliata');
    await user.click(screen.getByRole('button', { name: 'Accedi' }));

    expect(await screen.findByText('Email o password non corretti.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Accedi a Cancellamy' })).toBeInTheDocument();
    expect(getAccessToken()).toBeNull();
  });

  it('validates the form before calling the API', async () => {
    const user = userEvent.setup();
    renderApp('/accedi');

    await user.click(await screen.findByRole('button', { name: 'Accedi' }));
    expect(await screen.findAllByText('Campo obbligatorio')).toHaveLength(2);

    await user.type(screen.getByLabelText('Email'), 'non-una-email');
    await user.type(screen.getByLabelText('Password'), 'x');
    await user.click(screen.getByRole('button', { name: 'Accedi' }));
    expect(await screen.findByText('Inserisci un indirizzo email valido')).toBeInTheDocument();
  });
});

describe('session restore and route protection', () => {
  it('redirects anonymous visitors from /app to the login page', async () => {
    renderApp('/app/richieste');

    expect(await screen.findByRole('heading', { name: 'Accedi a Cancellamy' })).toBeInTheDocument();
  });

  it('restores the session through the refresh cookie on load', async () => {
    server.use(http.post(apiUrl('/auth/refresh'), () => HttpResponse.json({ accessToken: TEST_ACCESS_TOKEN })));
    renderApp('/app');

    expect(await screen.findByRole('heading', { name: 'Panoramica' })).toBeInTheDocument();
    await waitFor(() => expect(getAccessToken()).toBe(TEST_ACCESS_TOKEN));
  });

  it('keeps regular users out of the admin area', async () => {
    server.use(http.post(apiUrl('/auth/refresh'), () => HttpResponse.json({ accessToken: TEST_ACCESS_TOKEN })));
    renderApp('/app/admin');

    expect(await screen.findByRole('heading', { name: 'Panoramica' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Amministrazione' })).not.toBeInTheDocument();
  });

  it('lets admins into the admin area', async () => {
    server.use(
      http.post(apiUrl('/auth/refresh'), () => HttpResponse.json({ accessToken: TEST_ACCESS_TOKEN })),
      http.get(apiUrl('/me'), () => HttpResponse.json(makeUser({ role: 'admin' }))),
      http.get(apiUrl('/admin/stats'), () =>
        HttpResponse.json({
          users: 3,
          profiles: 4,
          activeProfiles: 2,
          requestsByStatus: [{ status: 'sent', count: 7 }],
          messagesOut: 9,
          messagesIn: 1,
          unmatchedInbound: 0,
          mailMode: 'dry-run',
        }),
      ),
    );
    renderApp('/app/admin');

    expect(await screen.findByRole('heading', { name: 'Amministrazione' })).toBeInTheDocument();
    expect(await screen.findByText('Utenti')).toBeInTheDocument();
  });

  it('shows the verify-email banner to unverified users', async () => {
    server.use(
      http.post(apiUrl('/auth/refresh'), () => HttpResponse.json({ accessToken: TEST_ACCESS_TOKEN })),
      http.get(apiUrl('/me'), () => HttpResponse.json(makeUser({ emailVerified: false }))),
    );
    renderApp('/app');

    expect(await screen.findByText('Verifica la tua email')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reinvia email di verifica' })).toBeInTheDocument();
  });
});
