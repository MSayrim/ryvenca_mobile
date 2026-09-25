import { API_BASE_URL, REQUEST_TIMEOUT_MS } from '../config';
import { ApiError, NETWORK_ERROR_MESSAGE, TIMEOUT_MESSAGE, parseApiError } from './errors';

type QueryValue = string | number | boolean | null | undefined | readonly (string | number)[];

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  query?: Record<string, QueryValue>;
  /** JSON body (serialized automatically). */
  body?: unknown;
  /** Multipart body; Content-Type (with boundary) is set by the runtime. */
  formData?: FormData;
  /** Send the bearer token (default true). */
  auth?: boolean;
  timeoutMs?: number;
  signal?: AbortSignal;
}

let authToken: string | null = null;
let unauthorizedHandler: (() => void) | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
}

export function getAuthToken(): string | null {
  return authToken;
}

/** Called once for any 401 on an authenticated request (clears session → auth screen). */
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler;
}

/** Serializes query params; arrays become comma separated lists, empty values are skipped. */
export function buildQueryString(query: Record<string, QueryValue> | undefined): string {
  if (!query) return '';
  const parts: string[] = [];
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) {
      if (value.length === 0) continue;
      parts.push(`${encodeURIComponent(key)}=${value.map((v) => encodeURIComponent(String(v))).join(',')}`);
    } else {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
    }
  }
  return parts.length ? `?${parts.join('&')}` : '';
}

export function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  return `${API_BASE_URL}${path}${buildQueryString(query)}`;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', query, body, formData, auth = true, timeoutMs = REQUEST_TIMEOUT_MS } = options;

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (auth && authToken) headers.Authorization = `Bearer ${authToken}`;

  let payload: BodyInit | undefined;
  if (formData) {
    payload = formData;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  const externalAbort = () => controller.abort();
  options.signal?.addEventListener('abort', externalAbort);

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: payload,
      signal: controller.signal,
    });
  } catch {
    if (timedOut) throw new ApiError(0, 'TIMEOUT', TIMEOUT_MESSAGE);
    throw new ApiError(0, 'NETWORK_ERROR', NETWORK_ERROR_MESSAGE);
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener('abort', externalAbort);
  }

  const text = await response.text().catch(() => '');

  if (!response.ok) {
    const error = parseApiError(response.status, text);
    if (response.status === 401 && auth && authToken) {
      unauthorizedHandler?.();
    }
    throw error;
  }

  if (response.status === 204 || !text) return undefined as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ApiError(response.status, 'INTERNAL_ERROR', 'Sunucudan beklenmeyen bir yanıt geldi.');
  }
}
