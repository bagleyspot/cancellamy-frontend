import { http, HttpResponse } from 'msw';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { makeSummary } from '@/test/fixtures';
import { apiUrl, signedInHandlers } from '@/test/handlers';
import { renderApp } from '@/test/render';
import { server } from '@/test/server';

function openDashboard(toSend: number) {
  server.use(
    ...signedInHandlers(),
    http.get(apiUrl('/requests/summary'), () =>
      HttpResponse.json(makeSummary({ counts: { total: 10 + toSend, toSend, inProgress: 6, actionRequired: 2, completed: 2, notRemovable: 0 } })),
    ),
  );
  return renderApp('/app');
}

describe('dashboard: requests waiting to be sent', () => {
  it('shows a "Da inviare" card that links to the drafts, apart from the ones in progress', async () => {
    openDashboard(336);

    const card = (await screen.findAllByRole('link', { name: /Da inviare/ })).find((link) => link.getAttribute('href') === '/app/richieste?group=to_send');
    expect(card).toBeDefined();
    expect(card).toHaveTextContent('336');
    const inProgress = screen.getByRole('link', { name: /In corso/ });
    expect(inProgress).toHaveTextContent('6');
    expect(inProgress).not.toHaveTextContent('342');
  });

  it('does not show the card when nothing is waiting', async () => {
    openDashboard(0);

    await screen.findByRole('link', { name: /In corso/ });
    expect(screen.queryByRole('link', { name: /Da inviare/ })).not.toBeInTheDocument();
  });
});
