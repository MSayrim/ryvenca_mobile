// Web preview only: expo-secure-store is unavailable in browsers, so fall back to localStorage.
const TOKEN_KEY = 'ryvenca.session';

export interface StoredSession {
  token: string;
  expiresAt: string | null;
}

export async function loadSession(): Promise<StoredSession | null> {
  try {
    const raw = globalThis.localStorage?.getItem(TOKEN_KEY);
    return raw ? (JSON.parse(raw) as StoredSession) : null;
  } catch {
    return null;
  }
}

export async function saveSession(session: StoredSession): Promise<void> {
  try {
    globalThis.localStorage?.setItem(TOKEN_KEY, JSON.stringify(session));
  } catch {
    // ignore
  }
}

export async function clearSession(): Promise<void> {
  try {
    globalThis.localStorage?.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}
