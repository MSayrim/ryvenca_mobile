import { t } from '../i18n/i18n';
import type { ApiErrorBody, ApiErrorCode } from './types';

/** Error thrown by the API client for any non-2xx response or network failure. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode | 'NETWORK_ERROR' | 'TIMEOUT' | string;
  readonly fieldErrors: Record<string, string>;

  constructor(
    status: number,
    code: ApiError['code'],
    message: string,
    fieldErrors: Record<string, string> = {},
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isNetwork(): boolean {
    return this.code === 'NETWORK_ERROR' || this.code === 'TIMEOUT';
  }
}

/** Client-side fallback messages (in the current UI language). Server messages are already localized. */
export const networkErrorMessage = () => t('errors.network');
export const timeoutMessage = () => t('errors.timeout');
export const genericErrorMessage = () => t('errors.generic');
export const unexpectedResponseMessage = () => t('errors.unexpectedResponse');

/** Maximum photo size accepted by the backend (see API.md). */
const MAX_UPLOAD_MB = 15;

const FALLBACK_BY_STATUS: Record<number, { code: ApiErrorCode; message: () => string }> = {
  400: { code: 'VALIDATION_ERROR', message: () => t('errors.validation') },
  401: { code: 'UNAUTHORIZED', message: () => t('errors.unauthorized') },
  403: { code: 'FORBIDDEN', message: () => t('errors.forbidden') },
  404: { code: 'NOT_FOUND', message: () => t('errors.notFound') },
  409: { code: 'CONFLICT', message: () => t('errors.conflict') },
  413: { code: 'PAYLOAD_TOO_LARGE', message: () => t('errors.payloadTooLarge', { maxMb: MAX_UPLOAD_MB }) },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toFieldErrors(value: unknown): Record<string, string> {
  if (!isRecord(value)) return {};
  const out: Record<string, string> = {};
  for (const [key, v] of Object.entries(value)) {
    if (typeof v === 'string' && v.trim()) out[key] = v;
  }
  return out;
}

/**
 * Builds an ApiError from an HTTP status and raw response text.
 * Tolerates empty / non-JSON bodies (proxies, HTML error pages) and falls back to localized defaults.
 */
export function parseApiError(status: number, rawBody: string | null | undefined): ApiError {
  let body: Partial<ApiErrorBody> | null = null;
  if (rawBody && rawBody.trim()) {
    try {
      const parsed: unknown = JSON.parse(rawBody);
      if (isRecord(parsed)) body = parsed as Partial<ApiErrorBody>;
    } catch {
      body = null;
    }
  }

  const fallback =
    FALLBACK_BY_STATUS[status] ??
    (status >= 500
      ? { code: 'INTERNAL_ERROR' as const, message: () => t('errors.server') }
      : { code: 'INTERNAL_ERROR' as const, message: genericErrorMessage });

  const code = typeof body?.error === 'string' && body.error ? body.error : fallback.code;
  const message =
    typeof body?.message === 'string' && body.message.trim() ? body.message : fallback.message();
  const effectiveStatus = typeof body?.status === 'number' ? body.status : status;

  return new ApiError(effectiveStatus, code, message, toFieldErrors(body?.fieldErrors));
}

/** User-presentable message for any thrown value. */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return genericErrorMessage();
}

/** First field error (if any) — handy for forms that show a single inline message. */
export function firstFieldError(error: unknown): string | null {
  if (!(error instanceof ApiError)) return null;
  const first = Object.values(error.fieldErrors)[0];
  return first ?? null;
}
