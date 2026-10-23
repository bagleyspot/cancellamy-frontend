import { http, HttpResponse } from 'msw';
import { API_BASE_URL } from '@/api/http';
import type { ApiError, AuthResponse, UserDto } from '@/api/types';
import {
  TEST_PASSWORD,
  makeBreachSummary,
  makeBroker,
  makeBrokerStats,
  makeConfig,
  makeDataMap,
  makeIdentity,
  makeLeaderboard,
  makeNuisanceOverview,
  makeProfile,
  makeRequestListItem,
  makeSender,
  makeSummary,
  makeUser,
  paginated,
} from './fixtures';

export const apiUrl = (path: string) => `${API_BASE_URL}${path}`;

export function apiError(statusCode: number, code: ApiError['code'], message: string | string[] = 'Errore'): Response {
  const body: ApiError = { statusCode, error: 'Error', message, ...(code && { code }) };
  return HttpResponse.json(body, { status: statusCode });
}

export const TEST_ACCESS_TOKEN = 'test-access-token';

export function authResponse(overrides: Partial<AuthResponse> = {}): AuthResponse {
  return { user: makeUser(), accessToken: TEST_ACCESS_TOKEN, ...overrides };
}

/** Default happy-path handlers; tests override what they care about with server.use(...). */
export const defaultHandlers = [
  http.get(apiUrl('/config'), () => HttpResponse.json(makeConfig())),
  http.get(apiUrl('/brokers/stats'), () => HttpResponse.json(makeBrokerStats())),
  http.get(apiUrl('/brokers/leaderboard'), () => HttpResponse.json(makeLeaderboard())),
  http.get(apiUrl('/brokers'), () => HttpResponse.json(paginated([makeBroker()], { limit: 12 }))),

  // Anonymous by default: the refresh cookie is missing.
  http.post(apiUrl('/auth/refresh'), () => apiError(401, undefined, 'Unauthorized')),
  http.post(apiUrl('/auth/login'), async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string };
    if (body.email === 'mario@example.it' && body.password === TEST_PASSWORD) return HttpResponse.json(authResponse());
    return apiError(401, 'INVALID_CREDENTIALS', 'Credenziali non valide');
  }),
  http.post(apiUrl('/auth/logout'), () => new HttpResponse(null, { status: 204 })),
  http.get(apiUrl('/me'), () => HttpResponse.json(makeUser())),

  http.get(apiUrl('/profiles'), () => HttpResponse.json([makeProfile()])),
  http.get(apiUrl('/requests/summary'), () => HttpResponse.json(makeSummary())),
  http.get(apiUrl('/requests'), () => HttpResponse.json(paginated([makeRequestListItem()]))),
  http.get(apiUrl('/notifications/unread-count'), () => HttpResponse.json({ count: 0 })),

  // v2 read endpoints: neutral happy-path answers
  http.get(apiUrl('/profiles/:id/sender'), () => HttpResponse.json(makeSender())),
  http.get(apiUrl('/profiles/:id/identity'), () => HttpResponse.json(makeIdentity({ verified: true, contacts: [{ type: 'email', value: 'mario@example.it', verified: true, verifiedAt: '2026-03-01T10:00:00.000Z' }] }))),
  http.get(apiUrl('/profiles/:id/breaches'), () => HttpResponse.json(makeBreachSummary())),
  http.get(apiUrl('/profiles/:id/data-map'), () => HttpResponse.json(makeDataMap())),
  http.get(apiUrl('/nuisance'), () => HttpResponse.json(makeNuisanceOverview())),
  http.get(apiUrl('/delistings'), () => HttpResponse.json(paginated([]))),
];

/** Handlers that make the app restore a signed-in session on load. */
export function signedInHandlers(user: UserDto = makeUser()) {
  return [
    http.post(apiUrl('/auth/refresh'), () => HttpResponse.json({ accessToken: TEST_ACCESS_TOKEN })),
    http.get(apiUrl('/me'), () => HttpResponse.json(user)),
  ];
}
