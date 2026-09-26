/**
 * Sign in with Apple nonce (replay protection): Apple receives SHA-256(rawNonce) in the request and puts it
 * into the identity token; Firebase receives the raw nonce and checks that it hashes to the token's claim.
 * Pure helpers so they are unit tested; the native module injects expo-crypto.
 */

/** 64 URL-safe characters (so every byte maps without bias; rejection sampling stays for other sizes). */
export const NONCE_CHARSET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_';
export const NONCE_LENGTH = 32;

/**
 * Maps random bytes to nonce characters with rejection sampling (no modulo bias): bytes that fall into the
 * incomplete last block of the charset are skipped. Returns fewer characters than requested when the
 * bytes run out — callers ask for more bytes and retry.
 */
export function nonceFromBytes(bytes: ArrayLike<number>, length = NONCE_LENGTH): string {
  const size = NONCE_CHARSET.length;
  const limit = 256 - (256 % size);
  let out = '';
  for (let i = 0; i < bytes.length && out.length < length; i += 1) {
    const byte = bytes[i] as number;
    if (byte >= limit) continue;
    out += NONCE_CHARSET[byte % size];
  }
  return out;
}

export interface NonceDeps {
  randomBytes: (count: number) => Uint8Array | ArrayLike<number>;
  /** Lower-case hex SHA-256 of a UTF-8 string. */
  sha256Hex: (value: string) => Promise<string>;
}

export interface AppleNonce {
  /** Sent to Firebase with the identity token. */
  raw: string;
  /** Sent to Apple (`nonce` option of signInAsync). */
  hashed: string;
}

export async function createAppleNonce({ randomBytes, sha256Hex }: NonceDeps, length = NONCE_LENGTH): Promise<AppleNonce> {
  let raw = '';
  // Each attempt keeps ~97% of the bytes; the loop practically never runs twice.
  for (let attempt = 0; attempt < 8 && raw.length < length; attempt += 1) {
    raw += nonceFromBytes(randomBytes(length * 2), length - raw.length);
  }
  if (raw.length < length) throw new Error('Could not generate a nonce');
  const hashed = (await sha256Hex(raw)).toLowerCase();
  return { raw, hashed };
}

/** Apple's first-sign-in name parts → "Ayşe Yılmaz" (null when Apple sent no name). */
export function displayNameFromParts(parts: {
  givenName?: string | null;
  middleName?: string | null;
  familyName?: string | null;
  nickname?: string | null;
} | null | undefined): string | null {
  if (!parts) return null;
  const full = [parts.givenName, parts.middleName, parts.familyName]
    .map((p) => (typeof p === 'string' ? p.trim() : ''))
    .filter(Boolean)
    .join(' ');
  if (full) return full;
  const nick = typeof parts.nickname === 'string' ? parts.nickname.trim() : '';
  return nick || null;
}
