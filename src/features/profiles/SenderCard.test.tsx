import { http, HttpResponse } from 'msw';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { SetSenderRequest, SmtpSettingsInput } from '@/api/types';
import { makeConfig, makeProfile, makeSender } from '@/test/fixtures';
import { apiError, apiUrl, signedInHandlers } from '@/test/handlers';
import { renderApp } from '@/test/render';
import { server } from '@/test/server';
import { SENDER_PRESETS } from './senderPresets';

// A made-up value: it only has to travel from the field to the request body.
const TEST_APP_PASSWORD = 'not-a-real-password';

const profile = makeProfile({ emails: ['mario@example.it', 'mario.rossi@example.org'] });

function openProfile(sender = makeSender()) {
  server.use(
    ...signedInHandlers(),
    http.get(apiUrl('/profiles/profile-1'), () => HttpResponse.json(profile)),
    http.get(apiUrl('/profiles/profile-1/sender'), () => HttpResponse.json(sender)),
  );
  return renderApp('/app/profili/profile-1');
}

async function fillForm(user: ReturnType<typeof userEvent.setup>) {
  await screen.findByRole('heading', { name: 'Mittente delle email' });
  await user.clear(await screen.findByLabelText('Server SMTP'));
  await user.type(screen.getByLabelText('Server SMTP'), 'smtp.example.org');
  await user.selectOptions(screen.getByLabelText('Porta'), '465');
  await user.click(screen.getByLabelText(/Connessione cifrata fin dall’inizio/));
  await user.type(screen.getByLabelText('Nome utente'), 'mario');
  await user.type(screen.getByLabelText('Password per le app'), 'app-password-123');
  await user.selectOptions(screen.getByLabelText('Indirizzo mittente'), 'mario.rossi@example.org');
}

describe('profile: sender card', () => {
  it('uses a password field that is never prefilled, even when SMTP is already configured', async () => {
    openProfile(
      makeSender({
        mode: 'smtp',
        smtp: { host: 'smtp.example.org', port: 587, secure: false, username: 'mario', fromAddress: 'mario@example.it' },
        verifiedAt: '2026-03-01T10:00:00.000Z',
      }),
    );

    const password = await screen.findByLabelText('Password per le app');
    expect(password).toHaveAttribute('type', 'password');
    expect(password).toHaveAttribute('autocomplete', 'off');
    expect(password).toHaveValue('');
    expect(screen.getByLabelText('Server SMTP')).toHaveValue('smtp.example.org');
    expect(screen.getByText('Dalla tua casella')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Torna a Cancellamy' })).toBeInTheDocument();
  });

  it('explains the reply address and offers only the port choices allowed by the backend', async () => {
    openProfile();

    expect(await screen.findByText(/r-abc123@reply\.cancellamy\.example/)).toBeInTheDocument();
    const ports = Array.from((screen.getByLabelText('Porta') as HTMLSelectElement).options).map((option) => option.value);
    expect(ports).toEqual(['465', '587', '25', '2525']);
    const from = Array.from((screen.getByLabelText('Indirizzo mittente') as HTMLSelectElement).options).map((option) => option.value);
    expect(from).toEqual(profile.emails);
    expect(screen.queryByRole('button', { name: 'Torna a Cancellamy' })).not.toBeInTheDocument();
  });

  it('explains that replies go straight to the user when the instance runs in mailbox mode', async () => {
    server.use(http.get(apiUrl('/config'), () => HttpResponse.json(makeConfig({ mailMode: 'mailbox' }))));
    openProfile(makeSender({ mode: 'smtp', smtp: { host: 'smtp.example.org', port: 587, secure: false, username: 'mario', fromAddress: 'mario@example.it' }, replyAddress: 'mario@example.it' }));

    expect(await screen.findByText(/i broker rispondono direttamente a te, all’indirizzo mario@example\.it/)).toBeInTheDocument();
    expect(screen.queryByText(/arrivano comunque a Cancellamy/)).not.toBeInTheDocument();
  });

  it('requires the password before testing or saving', async () => {
    const user = userEvent.setup();
    openProfile();
    await user.type(await screen.findByLabelText('Server SMTP'), 'smtp.example.org');
    await user.type(screen.getByLabelText('Nome utente'), 'mario');

    await user.click(screen.getByRole('button', { name: 'Prova la connessione' }));

    expect(await screen.findByText('Campo obbligatorio')).toBeInTheDocument();
  });

  it('fills server, port and user name when Gmail is chosen and keeps the user name in sync with the sender address', async () => {
    const user = userEvent.setup();
    openProfile();
    await user.selectOptions(await screen.findByLabelText('Provider di posta'), 'gmail');

    expect(screen.getByLabelText('Server SMTP')).toHaveValue('smtp.gmail.com');
    expect(screen.getByLabelText('Porta')).toHaveValue('587');
    expect(screen.getByLabelText(/Connessione cifrata fin dall’inizio/)).not.toBeChecked();
    expect(screen.getByLabelText('Nome utente')).toHaveValue('mario@example.it');
    const link = screen.getByRole('link', { name: /Crea una password per le app Google/ });
    expect(link).toHaveAttribute('href', 'https://myaccount.google.com/apppasswords');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');

    await user.selectOptions(screen.getByLabelText('Indirizzo mittente'), 'mario.rossi@example.org');
    expect(screen.getByLabelText('Nome utente')).toHaveValue('mario.rossi@example.org');
  });

  it.each([
    ['icloud', 'Come collegare iCloud Mail', 'smtp.mail.me.com', '587', false, 'https://account.apple.com/account/manage'],
    ['yahoo', 'Come collegare Yahoo Mail', 'smtp.mail.yahoo.com', '465', true, 'https://login.yahoo.com/account/security'],
    ['libero', 'Come collegare Libero Mail', 'smtp.libero.it', '465', true, null],
    ['aruba', 'Come collegare una casella Aruba', 'smtps.aruba.it', '465', true, null],
  ])('fills the %s preset and shows its guide', async (provider, guideTitle, host, port, secure, linkHref) => {
    const user = userEvent.setup();
    openProfile();
    await user.selectOptions(await screen.findByLabelText('Provider di posta'), provider);

    expect(screen.getByLabelText('Server SMTP')).toHaveValue(host);
    expect(screen.getByLabelText('Porta')).toHaveValue(port);
    const tls = screen.getByLabelText(/Connessione cifrata fin dall’inizio/);
    if (secure) expect(tls).toBeChecked();
    else expect(tls).not.toBeChecked();
    expect(screen.getByLabelText('Nome utente')).toHaveValue('mario@example.it');
    const guide = screen.getByText(guideTitle).closest('[role="status"]') as HTMLElement;
    const links = within(guide).queryAllByRole('link');
    if (linkHref) expect(links.map((link) => link.getAttribute('href'))).toContain(linkHref);
    else expect(links).toHaveLength(0);
  });

  it('shows the Gmail guide when Gmail is already configured, and hides it after switching to another server', async () => {
    const user = userEvent.setup();
    openProfile(
      makeSender({
        mode: 'smtp',
        smtp: { host: 'smtp.gmail.com', port: 587, secure: false, username: 'mario@example.it', fromAddress: 'mario@example.it' },
      }),
    );

    expect(await screen.findByLabelText('Provider di posta')).toHaveValue('gmail');
    expect(screen.getByText('Come collegare Gmail')).toBeInTheDocument();

    await user.clear(screen.getByLabelText('Server SMTP'));
    await user.type(screen.getByLabelText('Server SMTP'), 'smtp.example.org');

    expect(screen.getByLabelText('Provider di posta')).toHaveValue('other');
    expect(screen.queryByText('Come collegare Gmail')).not.toBeInTheDocument();
  });

  it('sends the Gmail preset values when saving', async () => {
    const user = userEvent.setup();
    const bodies: SetSenderRequest[] = [];
    openProfile();
    server.use(
      http.put(apiUrl('/profiles/profile-1/sender'), async ({ request }) => {
        bodies.push((await request.json()) as SetSenderRequest);
        return HttpResponse.json(makeSender());
      }),
    );
    await user.selectOptions(await screen.findByLabelText('Provider di posta'), 'gmail');
    await user.type(screen.getByLabelText('Password per le app'), TEST_APP_PASSWORD);

    await user.click(screen.getByRole('button', { name: 'Salva' }));

    await screen.findByText(/Impostazioni salvate/);
    expect(bodies).toEqual([
      {
        mode: 'smtp',
        smtp: { host: SENDER_PRESETS.gmail.host, port: 587, secure: false, username: 'mario@example.it', fromAddress: 'mario@example.it', password: TEST_APP_PASSWORD },
      },
    ]);
  });

  it('tests the connection with the form values and shows a friendly error when it fails', async () => {
    const user = userEvent.setup();
    const bodies: SmtpSettingsInput[] = [];
    openProfile();
    server.use(
      http.post(apiUrl('/profiles/profile-1/sender/test'), async ({ request }) => {
        bodies.push((await request.json()) as SmtpSettingsInput);
        return apiError(400, 'SMTP_CONNECTION_FAILED', 'Autenticazione rifiutata dal server (535)');
      }),
    );
    await fillForm(user);

    await user.click(screen.getByRole('button', { name: 'Prova la connessione' }));

    expect(await screen.findByText(/Non riusciamo a collegarci al tuo server di posta/)).toBeInTheDocument();
    expect(screen.getByText(/Autenticazione rifiutata dal server \(535\)/)).toBeInTheDocument();
    expect(bodies).toEqual([
      { host: 'smtp.example.org', port: 465, secure: true, username: 'mario', password: 'app-password-123', fromAddress: 'mario.rossi@example.org' },
    ]);
    // a failed test keeps what the user typed so it can be fixed
    expect(screen.getByLabelText('Password per le app')).toHaveValue('app-password-123');
  });

  it('maps SMTP_HOST_NOT_ALLOWED to a friendly message', async () => {
    const user = userEvent.setup();
    openProfile();
    server.use(http.post(apiUrl('/profiles/profile-1/sender/test'), () => apiError(400, 'SMTP_HOST_NOT_ALLOWED', 'host privato')));
    await fillForm(user);

    await user.click(screen.getByRole('button', { name: 'Prova la connessione' }));

    expect(await screen.findByText(/Questo server non è ammesso/)).toBeInTheDocument();
  });

  it('shows a success message when the test works', async () => {
    const user = userEvent.setup();
    openProfile();
    server.use(http.post(apiUrl('/profiles/profile-1/sender/test'), () => HttpResponse.json({ ok: true })));
    await fillForm(user);

    await user.click(screen.getByRole('button', { name: 'Prova la connessione' }));

    expect(await screen.findByText('Connessione riuscita. Non è stata inviata nessuna email.')).toBeInTheDocument();
  });

  it('saves the SMTP settings and clears the password field afterwards', async () => {
    const user = userEvent.setup();
    const bodies: SetSenderRequest[] = [];
    let stored = makeSender();
    openProfile();
    server.use(
      http.get(apiUrl('/profiles/profile-1/sender'), () => HttpResponse.json(stored)),
      http.put(apiUrl('/profiles/profile-1/sender'), async ({ request }) => {
        const body = (await request.json()) as SetSenderRequest;
        bodies.push(body);
        stored = makeSender({
          mode: 'smtp',
          smtp: body.smtp ? { host: body.smtp.host, port: body.smtp.port, secure: body.smtp.secure, username: body.smtp.username, fromAddress: body.smtp.fromAddress } : null,
          verifiedAt: '2026-03-02T10:00:00.000Z',
        });
        return HttpResponse.json(stored);
      }),
    );
    await fillForm(user);

    await user.click(screen.getByRole('button', { name: 'Salva' }));

    expect(await screen.findByText(/le prossime email partiranno dalla tua casella/)).toBeInTheDocument();
    expect(bodies).toHaveLength(1);
    expect(bodies[0]).toMatchObject({ mode: 'smtp', smtp: { host: 'smtp.example.org', port: 465, password: 'app-password-123' } });
    expect(screen.getByLabelText('Password per le app')).toHaveValue('');
    expect(await screen.findByRole('button', { name: 'Torna a Cancellamy' })).toBeInTheDocument();
  });

  it('returns to Cancellamy after confirmation', async () => {
    const user = userEvent.setup();
    let called = false;
    openProfile(
      makeSender({
        mode: 'smtp',
        smtp: { host: 'smtp.example.org', port: 587, secure: false, username: 'mario', fromAddress: 'mario@example.it' },
      }),
    );
    server.use(
      http.delete(apiUrl('/profiles/profile-1/sender'), () => {
        called = true;
        return HttpResponse.json(makeSender());
      }),
    );

    await user.click(await screen.findByRole('button', { name: 'Torna a Cancellamy' }));
    await user.click(await screen.findByRole('button', { name: 'Sì, torna a Cancellamy' }));

    await screen.findByText('Ora le email partono da Cancellamy.');
    expect(called).toBe(true);
  });

  it('shows the last sending error reported by the backend', async () => {
    openProfile(
      makeSender({
        mode: 'smtp',
        smtp: { host: 'smtp.example.org', port: 587, secure: false, username: 'mario', fromAddress: 'mario@example.it' },
        lastError: 'Invalid login: 535 Authentication failed',
      }),
    );

    expect(await screen.findByText('L’ultimo invio non è riuscito')).toBeInTheDocument();
    expect(screen.getByText('Invalid login: 535 Authentication failed')).toBeInTheDocument();
  });
});
