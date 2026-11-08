import { http, HttpResponse } from 'msw';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { makeRequestListItem, makeSummary, paginated } from '@/test/fixtures';
import { apiUrl, signedInHandlers } from '@/test/handlers';
import { renderApp } from '@/test/render';
import { server } from '@/test/server';

function openRequests(path = '/app/richieste') {
  const queries: URLSearchParams[] = [];
  server.use(
    ...signedInHandlers(),
    http.get(apiUrl('/requests/summary'), () => HttpResponse.json(makeSummary())),
    http.get(apiUrl('/requests'), ({ request }) => {
      const params = new URL(request.url).searchParams;
      queries.push(params);
      return HttpResponse.json(paginated(params.get('area') === 'unknown' ? [] : [makeRequestListItem()]));
    }),
  );
  renderApp(path);
  return queries;
}

describe('requests: geographic area filter', () => {
  it('offers the areas, sends the chosen one to the API and keeps it in the URL', async () => {
    const user = userEvent.setup();
    const queries = openRequests();

    const select = await screen.findByLabelText('Area geografica');
    expect(screen.getByRole('option', { name: 'Tutte le aree' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Copre l’Italia' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Solo altri mercati' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Non classificati' })).toBeInTheDocument();
    expect(queries[0]?.has('area')).toBe(false);

    await user.selectOptions(select, 'italy');

    await waitFor(() => expect(queries.some((q) => q.get('area') === 'italy')).toBe(true));
    expect(select).toHaveValue('italy');
  });

  it('starts from the area in the URL', async () => {
    const queries = openRequests('/app/richieste?area=other');
    expect(await screen.findByLabelText('Area geografica')).toHaveValue('other');
    await waitFor(() => expect(queries.some((q) => q.get('area') === 'other')).toBe(true));
  });

  it('ignores an unknown area in the URL', async () => {
    const queries = openRequests('/app/richieste?area=mars');
    expect(await screen.findByLabelText('Area geografica')).toHaveValue('');
    await waitFor(() => expect(queries.length).toBeGreaterThan(0));
    expect(queries.every((q) => !q.has('area'))).toBe(true);
  });

  it('says that no request matches the filters when the area has none', async () => {
    openRequests('/app/richieste?area=unknown');
    expect(await screen.findByText('Nessuna richiesta corrisponde ai filtri.')).toBeInTheDocument();
  });
});
