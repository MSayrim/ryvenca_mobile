/**
 * Single place for runtime configuration.
 *
 * EXPO_PUBLIC_API_BASE_URL is inlined at build time by Expo.
 *   - iOS simulator / web: http://localhost:8080 (default)
 *   - Android emulator:    http://10.0.2.2:8080
 *   - Physical device:     http://<LAN-IP>:8080
 */
const DEFAULT_API_BASE_URL = 'http://localhost:8080';

export function normalizeBaseUrl(raw: string | undefined | null): string {
  const value = (raw ?? '').trim();
  if (!value) return DEFAULT_API_BASE_URL;
  return value.replace(/\/+$/, '');
}

export const API_BASE_URL = normalizeBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL);

/** Request timeouts (ms). */
export const REQUEST_TIMEOUT_MS = 30_000;
export const UPLOAD_TIMEOUT_MS = 90_000;
