import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { api } from '@/api/endpoints';
import { ApiRequestError, getAccessToken, setAccessToken, setSessionExpiredHandler } from '@/api/http';
import { makeUser } from '@/test/fixtures';
import { apiError, apiUrl } from '@/test/handlers';
import { server } from '@/test/server';

describe('http client: refresh on 401', () => {
  it('refreshes once and retries the original request with the new token', async () => {
    let refreshCalls = 0;
    const seenTokens: (string | null)[] = [];
    server.use(
      http.post(apiUrl('/auth/refresh'), () => {
        refreshCalls += 1;
        return HttpResponse.json({ accessToken: 'fresh-token' });
      }),
      http.get(apiUrl('/me'), ({ request }) => {
        const header = request.headers.get('Authorization');
        seenTokens.push(header);
        if (header === 'Bearer fresh-token') return HttpResponse.json(makeUser());
        return apiError(401, undefined, 'Unauthorized');
      }),
    );
    setAccessToken('expired-token');

    const user = await api.me.get();

    expect(user.email).toBe('mario@example.it');
    expect(refreshCalls).toBe(1);
    expect(seenTokens).toEqual(['Bearer expired-token', 'Bearer fresh-token']);
    expect(getAccessToken()).toBe('fresh-token');
  });

  it('shares a single refresh between concurrent requests', async () => {
    let refreshCalls = 0;
    server.use(
      http.post(apiUrl('/auth/refresh'), async () => {
        refreshCalls += 1;
        await new Promise((resolve) => setTimeout(resolve, 20));
        return HttpResponse.json({ accessToken: 'fresh-token' });
      }),
      http.get(apiUrl('/me'), ({ request }) =>
        request.headers.get('Authorization') === 'Bearer fresh-token' ? HttpResponse.json(makeUser()) : apiError(401, undefined),
      ),
      http.get(apiUrl('/profiles'), ({ request }) =>
        request.headers.get('Authorization') === 'Bearer fresh-token' ? HttpResponse.json([]) : apiError(401, undefined),
      ),
    );
    setAccessToken('expired-token');

    await Promise.all([api.me.get(), api.profiles.list()]);

    expect(refreshCalls).toBe(1);
  });

  it('gives up after one retry and signals session expiry when refresh fails', async () => {
    const onExpired = vi.fn();
    setSessionExpiredHandler(onExpired);
    setAccessToken('expired-token');
    server.use(http.get(apiUrl('/me'), () => apiError(401, undefined, 'Unauthorized')));

    await expect(api.me.get()).rejects.toMatchObject({ status: 401 });

    expect(onExpired).toHaveBeenCalledTimes(1);
    expect(getAccessToken()).toBeNull();
  });

  it('retries only once when the retried request is still unauthorized', async () => {
    let calls = 0;
    const onExpired = vi.fn();
    setSessionExpiredHandler(onExpired);
    server.use(
      http.post(apiUrl('/auth/refresh'), () => HttpResponse.json({ accessToken: 'fresh-token' })),
      http.get(apiUrl('/me'), () => {
        calls += 1;
        return apiError(401, undefined, 'Unauthorized');
      }),
    );

    await expect(api.me.get()).rejects.toBeInstanceOf(ApiRequestError);

    expect(calls).toBe(2);
    expect(onExpired).toHaveBeenCalledTimes(1);
  });

  it('does not refresh on a failed login', async () => {
    let refreshCalls = 0;
    server.use(
      http.post(apiUrl('/auth/refresh'), () => {
        refreshCalls += 1;
        return HttpResponse.json({ accessToken: 'x' });
      }),
    );

    await expect(api.auth.login({ email: 'a@b.it', password: 'sbagliata' })).rejects.toMatchObject({
      status: 401,
      code: 'INVALID_CREDENTIALS',
    });
    expect(refreshCalls).toBe(0);
  });

  it('does not treat a wrong current password (401 INVALID_CREDENTIALS) as an expired session', async () => {
    const onExpired = vi.fn();
    setSessionExpiredHandler(onExpired);
    setAccessToken('valid-token');
    server.use(http.post(apiUrl('/me/change-password'), () => apiError(401, 'INVALID_CREDENTIALS')));

    await expect(api.me.changePassword({ currentPassword: 'x', newPassword: 'y'.repeat(10) })).rejects.toMatchObject({
      code: 'INVALID_CREDENTIALS',
    });
    expect(onExpired).not.toHaveBeenCalled();
    expect(getAccessToken()).toBe('valid-token');
  });

  it('exposes validation messages as a list', async () => {
    server.use(http.post(apiUrl('/auth/register'), () => apiError(400, 'VALIDATION_ERROR', ['email must be an email', 'password too short'])));

    const error = await api.auth.register({ email: 'x', password: 'y', acceptTerms: true }).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiRequestError);
    expect((error as ApiRequestError).messages).toEqual(['email must be an email', 'password too short']);
  });
});
