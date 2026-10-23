import { http, HttpResponse } from 'msw';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { CreateAccessRequestsInput, CreateAccessRequestsResponse, ProfileDto } from '@/api/types';
import { makeBroker, makeDataMap, makeProfile, makeRequestListItem, paginated } from '@/test/fixtures';
import { apiUrl, signedInHandlers } from '@/test/handlers';
import { renderApp } from '@/test/render';
import { server } from '@/test/server';

function openAccess(profile: ProfileDto = makeProfile(), brokers = [makeBroker({ id: 'b1', name: 'Pagine Esempio' }), makeBroker({ id: 'b2', name: 'Dati Srl' })]) {
  server.use(
    ...signedInHandlers(),
    http.get(apiUrl('/profiles'), () => HttpResponse.json([profile])),
    http.get(apiUrl('/brokers'), () => HttpResponse.json(paginated(brokers, { limit: 20 }))),
  );
  return renderApp('/app/accesso');
}

describe('access page ("Cosa sai di me")', () => {
  it('explains art. 15 and is blocked, with a link to the identity card, when the identity is not verified', async () => {
    openAccess(makeProfile({ identityVerified: false }));

    expect(await screen.findByText('Prima verifica la tua identità')).toBeInTheDocument();
    expect(screen.getByText('Il diritto di accesso (art. 15 GDPR)')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Vai alla verifica dell’identità' })).toHaveAttribute('href', '/app/profili/profile-1#identita');
    expect(screen.queryByText('Scegli i broker da interrogare')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Invia le richieste di accesso' })).not.toBeInTheDocument();
  });

  it('asks to activate the profile first when it is not active', async () => {
    openAccess(makeProfile({ status: 'ready' }));

    expect(await screen.findByText('Il profilo deve essere attivo')).toBeInTheDocument();
    expect(screen.queryByText('Scegli i broker da interrogare')).not.toBeInTheDocument();
  });

  it('lists only contactable brokers and counts the selection', async () => {
    const user = userEvent.setup();
    openAccess(makeProfile(), [
      makeBroker({ id: 'b1', name: 'Pagine Esempio' }),
      makeBroker({ id: 'b2', name: 'Dati Srl' }),
      makeBroker({ id: 'b3', name: 'Non Contattabile', sendEnabled: false }),
    ]);

    expect(await screen.findByRole('checkbox', { name: /Pagine Esempio/ })).toBeInTheDocument();
    expect(screen.queryByText('Non Contattabile')).not.toBeInTheDocument();
    expect(screen.getByText('Selezionati: 0 di 20')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Invia le richieste di accesso' })).toBeDisabled();

    await user.click(screen.getByRole('checkbox', { name: /Pagine Esempio/ }));
    await user.click(screen.getByRole('checkbox', { name: /Dati Srl/ }));
    expect(screen.getByText('Selezionati: 2 di 20')).toBeInTheDocument();
  });

  it('allows at most 20 brokers', async () => {
    const user = userEvent.setup();
    const brokers = Array.from({ length: 21 }, (_, index) => makeBroker({ id: `b${index}`, name: `Broker ${String(index).padStart(2, '0')}` }));
    openAccess(makeProfile(), brokers);

    for (let index = 0; index < 20; index += 1) {
      await user.click(await screen.findByLabelText(new RegExp(`Broker ${String(index).padStart(2, '0')}`)));
    }

    expect(screen.getByText('Selezionati: 20 di 20')).toBeInTheDocument();
    expect(screen.getByText('Hai raggiunto il massimo di 20 broker per volta.')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /Broker 20/ })).toBeDisabled();
  });

  it('sends the access requests and shows created and skipped brokers with Italian reasons', async () => {
    const user = userEvent.setup();
    const bodies: CreateAccessRequestsInput[] = [];
    openAccess();
    server.use(
      http.post(apiUrl('/requests/access'), async ({ request }) => {
        bodies.push((await request.json()) as CreateAccessRequestsInput);
        const body: CreateAccessRequestsResponse = {
          created: [makeRequestListItem({ id: 'req-new', kind: 'access', broker: { id: 'b1', name: 'Pagine Esempio', website: null, category: 'phone_directory' } })],
          skipped: [{ brokerId: 'b2', reason: 'exists' }],
        };
        return HttpResponse.json(body, { status: 201 });
      }),
    );

    await user.click(await screen.findByRole('checkbox', { name: /Pagine Esempio/ }));
    await user.click(screen.getByRole('checkbox', { name: /Dati Srl/ }));
    await user.click(screen.getByRole('button', { name: 'Invia le richieste di accesso' }));

    expect(await screen.findByText('1 richiesta creata.')).toBeInTheDocument();
    expect(bodies).toEqual([{ profileId: 'profile-1', brokerIds: ['b1', 'b2'] }]);
    expect(screen.getByRole('link', { name: 'Apri la richiesta per Pagine Esempio' })).toHaveAttribute('href', '/app/richieste/req-new');
    expect(screen.getByText('Dati Srl: hai già una richiesta di accesso aperta')).toBeInTheDocument();
    expect(screen.getByText('Selezionati: 0 di 20')).toBeInTheDocument();
  });

  it('renders the data map: totals, category chips and a table linking to each request', async () => {
    openAccess();

    const table = await screen.findByRole('table', { name: 'Esito delle richieste di accesso per broker' });
    expect(within(table).getByText('Pagine Esempio')).toBeInTheDocument();
    expect(within(table).getByText('Dati Srl')).toBeInTheDocument();
    expect(within(table).getByText('Sì')).toBeInTheDocument();
    expect(within(table).getByText('Non ancora noto')).toBeInTheDocument();
    expect(within(table).getByRole('link', { name: 'Apri la richiesta di accesso a Pagine Esempio' })).toHaveAttribute('href', '/app/richieste/req-a1');

    const totals = screen.getByText('Richieste inviate').closest('div') as HTMLElement;
    expect(within(totals).getByText('2')).toBeInTheDocument();
    const chips = screen.getByRole('heading', { name: 'Che tipo di dati sono stati trovati' }).closest('section') as HTMLElement;
    expect(within(chips).getByText('Contatti')).toBeInTheDocument();
    expect(within(chips).getByText('Indirizzi')).toBeInTheDocument();
  });

  it('shows an empty state when there are no access requests yet', async () => {
    openAccess();
    server.use(
      http.get(apiUrl('/profiles/profile-1/data-map'), () =>
        HttpResponse.json(makeDataMap({ entries: [], totals: { asked: 0, answered: 0, found: 0, notFound: 0 }, categoryCounts: [] })),
      ),
    );

    expect(await screen.findByText('Nessuna richiesta di accesso')).toBeInTheDocument();
  });
});
