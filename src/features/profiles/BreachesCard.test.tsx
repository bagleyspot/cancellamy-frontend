import { http, HttpResponse } from 'msw';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { BreachSummaryDto } from '@/api/types';
import { makeBreachSummary, makeProfile } from '@/test/fixtures';
import { apiError, apiUrl, signedInHandlers } from '@/test/handlers';
import { renderApp } from '@/test/render';
import { server } from '@/test/server';

function openProfile(summary: BreachSummaryDto = makeBreachSummary()) {
  server.use(
    ...signedInHandlers(),
    http.get(apiUrl('/profiles/profile-1'), () => HttpResponse.json(makeProfile())),
    http.get(apiUrl('/profiles/profile-1/breaches'), () => HttpResponse.json(summary)),
  );
  return renderApp('/app/profili/profile-1');
}

describe('profile: breaches card', () => {
  it('lists the breaches of each verified email with badges and data classes', async () => {
    openProfile();

    const card = (await screen.findByRole('heading', { name: 'Violazioni dei dati' })).closest('div[id="violazioni"]') as HTMLElement;
    expect(await within(card).findByText('Example Leak')).toBeInTheDocument();
    expect(within(card).getByText('Violazione verificata')).toBeInTheDocument();
    expect(within(card).getByText('Email addresses')).toBeInTheDocument();
    expect(within(card).getByText('Passwords')).toBeInTheDocument();
    expect(within(card).queryByText('Dati sensibili')).not.toBeInTheDocument();
  });

  it('marks sensitive breaches', async () => {
    const summary = makeBreachSummary();
    const entry = summary.emails[0];
    if (!entry || !entry.breaches[0]) throw new Error('fixture');
    entry.breaches[0].isSensitive = true;
    openProfile(summary);

    expect(await screen.findByText('Dati sensibili')).toBeInTheDocument();
  });

  it('always shows the attribution from the API with a link to haveibeenpwned.com', async () => {
    openProfile();

    expect(await screen.findByText(/Breach data provided by Have I Been Pwned/)).toBeInTheDocument();
    const link = screen.getByRole('link', { name: 'haveibeenpwned.com' });
    expect(link).toHaveAttribute('href', 'https://haveibeenpwned.com');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });

  it('notes the unverified emails and links to the identity card', async () => {
    openProfile(makeBreachSummary({ unverifiedEmails: ['altro@example.it'] }));

    expect(await screen.findByText('1 indirizzo non è ancora verificato e non viene controllato.')).toBeInTheDocument();
    expect(screen.getByText('altro@example.it')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Verificali nella scheda Identità' })).toHaveAttribute('href', '/app/profili/profile-1#identita');
  });

  it('starts a check and tells the user it is running', async () => {
    const user = userEvent.setup();
    let queued = false;
    openProfile();
    server.use(
      http.post(apiUrl('/profiles/profile-1/breaches/check'), () => {
        queued = true;
        return HttpResponse.json({ queued: 1 }, { status: 202 });
      }),
    );

    await user.click(await screen.findByRole('button', { name: 'Controlla ora' }));

    expect(await screen.findByText(/Controllo avviato/)).toBeInTheDocument();
    expect(queued).toBe(true);
  });

  it('asks to retry later when the check is rate limited (429)', async () => {
    const user = userEvent.setup();
    openProfile();
    server.use(http.post(apiUrl('/profiles/profile-1/breaches/check'), () => apiError(429, 'RATE_LIMITED', 'troppo presto')));

    await user.click(await screen.findByRole('button', { name: 'Controlla ora' }));

    expect(await screen.findByText('Puoi controllare una sola volta all’ora per profilo. Riprova più tardi.')).toBeInTheDocument();
  });

  it('says so when the instance has no breach API key and offers no check button', async () => {
    openProfile(makeBreachSummary({ enabled: false, emails: [] }));

    expect(await screen.findByText('Il controllo delle violazioni non è attivo su questa installazione.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Controlla ora' })).not.toBeInTheDocument();
  });
});
