import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'ryvenca.session';

export interface StoredSession {
  token: string;
  expiresAt: string | null;
}

export async function loadSession(): Promise<StoredSession | null> {
  try {
    const raw = await SecureStore.getItemAsync(TOKEN_KEY);
    return raw ? (JSON.parse(raw) as StoredSession) : null;
  } catch {
    return null;
  }
}

export async function saveSession(session: StoredSession): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, JSON.stringify(session));
}

export async function clearSession(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    // ignore
  }
}
