/**
 * Semantic-ish version comparison for the forced-update gate (`config.minVersion`).
 * Accepts "1", "1.2", "1.2.3", "v1.2.3", "1.2.3-beta.1", "1.2.3 (45)"; missing parts count as 0 and
 * pre-release/build suffixes are ignored. Returns null for strings without a leading number.
 */
export function parseVersion(value: string | null | undefined): number[] | null {
  if (typeof value !== 'string') return null;
  const match = /^\s*v?(\d+(?:\.\d+)*)/i.exec(value);
  if (!match?.[1]) return null;
  return match[1].split('.').map((part) => Number.parseInt(part, 10));
}

/** -1 if a < b, 0 if equal, 1 if a > b. Unparseable versions compare as equal (never block). */
export function compareVersions(a: string | null | undefined, b: string | null | undefined): -1 | 0 | 1 {
  const pa = parseVersion(a);
  const pb = parseVersion(b);
  if (!pa || !pb) return 0;
  const length = Math.max(pa.length, pb.length);
  for (let i = 0; i < length; i += 1) {
    const x = pa[i] ?? 0;
    const y = pb[i] ?? 0;
    if (x < y) return -1;
    if (x > y) return 1;
  }
  return 0;
}

/**
 * True when the installed version is known, a minimum is set, and installed < minimum.
 * Unknown/invalid values never block the user.
 */
export function isUpdateRequired(installed: string | null | undefined, minimum: string | null | undefined): boolean {
  if (!installed || !minimum) return false;
  if (!parseVersion(installed) || !parseVersion(minimum)) return false;
  return compareVersions(installed, minimum) < 0;
}
