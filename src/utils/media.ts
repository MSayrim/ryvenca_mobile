/**
 * Image URLs from the API are absolute. When the backend builds them as http://localhost:8080/…
 * but the device reaches the backend through another host (e.g. Android emulator → 10.0.2.2),
 * rewrite the origin to the configured API base URL so photos still load in development.
 */
const LOOPBACK = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(?=\/|$)/i;

export function resolveMediaUrl(url: string | null | undefined, apiBaseUrl: string): string | null {
  if (!url) return null;
  if (url.startsWith('/')) return `${apiBaseUrl}${url}`;
  if (LOOPBACK.test(url) && !LOOPBACK.test(apiBaseUrl)) {
    return url.replace(LOOPBACK, apiBaseUrl);
  }
  return url;
}
