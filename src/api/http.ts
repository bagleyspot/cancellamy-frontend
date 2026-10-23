import type { ApiError, ApiErrorCode } from './types';

/**
 * Low-level HTTP layer: the ONLY place that calls fetch.
 * - access token lives in memory only;
 * - the refresh token is the httpOnly cookie `cnc_rt` (sent with credentials: 'include');
 * - a 401 triggers exactly one (shared) refresh and one retry, otherwise the session-expired handler runs.
 */

const rawBase = import.meta.env.VITE_API_BASE_URL;
export const API_BASE_URL: string = (typeof rawBase === 'string' && rawBase.length > 0 ? rawBase : '/api/v1').replace(/\/+$/, '');

/** Endpoints where a 401 is a business answer (or carries no session) and must never trigger a refresh. */
const NO_REFRESH_PATHS = new Set([
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/auth/logout',
  '/auth/verify-email',
  '/auth/forgot-password',
  '/auth/reset-password',
]);

export class ApiRequestError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode | undefined;
  readonly messages: string[];

  constructor(status: number, messages: string[], code?: ApiErrorCode) {
    super(messages[0] ?? `HTTP ${status}`);
    this.name = 'ApiRequestError';
    this.status = status;
    this.messages = messages;
    this.code = code;
  }
}

export function isApiError(error: unknown): error is ApiRequestError {
  return error instanceof ApiRequestError;
}

let accessToken: string | null = null;
let refreshInFlight: Promise<string | null> | null = null;
let sessionExpiredHandler: (() => void) | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function setSessionExpiredHandler(handler: (() => void) | null): void {
  sessionExpiredHandler = handler;
}

/** Resets module state; used by tests. */
export function resetHttpState(): void {
  accessToken = null;
  refreshInFlight = null;
  sessionExpiredHandler = null;
}

function url(path: string, query?: object): string {
  const search = new URLSearchParams();
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === '') continue;
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return `${API_BASE_URL}${path}${qs ? `?${qs}` : ''}`;
}

/** Calls POST /auth/refresh; concurrent callers share a single request (refresh tokens rotate). */
export function refreshAccessToken(): Promise<string | null> {
  refreshInFlight ??= (async () => {
    try {
      const response = await fetch(url('/auth/refresh'), { method: 'POST', credentials: 'include' });
      if (!response.ok) {
        accessToken = null;
        return null;
      }
      const body = (await response.json()) as { accessToken?: unknown };
      accessToken = typeof body.accessToken === 'string' ? body.accessToken : null;
      return accessToken;
    } catch {
      accessToken = null;
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

interface RequestOptions {
  query?: object;
  body?: unknown;
  formData?: FormData;
}

async function send(method: string, path: string, options: RequestOptions, canRetry: boolean): Promise<Response> {
  const headers = new Headers();
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
  let body: BodyInit | undefined;
  if (options.formData) {
    body = options.formData;
  } else if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json');
    body = JSON.stringify(options.body);
  }

  const response = await fetch(url(path, options.query), { method, headers, body, credentials: 'include' });

  if (response.status === 401 && !NO_REFRESH_PATHS.has(path) && !(await isCredentialsMismatch(response))) {
    if (canRetry) {
      const token = await refreshAccessToken();
      if (token) return send(method, path, options, false);
    }
    sessionExpiredHandler?.();
  }
  return response;
}

/** A 401 INVALID_CREDENTIALS on an authenticated endpoint (e.g. wrong current password) is not an expired session. */
async function isCredentialsMismatch(response: Response): Promise<boolean> {
  try {
    const body = (await response.clone().json()) as Partial<ApiError>;
    return body.code === 'INVALID_CREDENTIALS';
  } catch {
    return false;
  }
}

async function toError(response: Response): Promise<ApiRequestError> {
  let parsed: Partial<ApiError> | null = null;
  try {
    parsed = (await response.json()) as Partial<ApiError>;
  } catch {
    parsed = null;
  }
  const raw = parsed?.message;
  const messages = Array.isArray(raw) ? raw : typeof raw === 'string' ? [raw] : [];
  return new ApiRequestError(response.status, messages, parsed?.code);
}

export async function request<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
  const response = await send(method, path, options, true);
  if (!response.ok) throw await toError(response);
  if (response.status === 204) return undefined as T;
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export interface BlobResult {
  blob: Blob;
  filename: string | null;
}

export async function requestBlob(path: string, query?: object): Promise<BlobResult> {
  const response = await send('GET', path, query ? { query } : {}, true);
  if (!response.ok) throw await toError(response);
  const disposition = response.headers.get('Content-Disposition');
  const match = disposition ? /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition) : null;
  return { blob: await response.blob(), filename: match?.[1] ? decodeURIComponent(match[1]) : null };
}
