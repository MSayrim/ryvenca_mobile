// Web preview: expo-secure-store is unavailable in browsers, so fall back to localStorage.
import { parseStoredLanguage, serializeStoredLanguage, type StoredLanguage } from './storedLanguage';

const LANGUAGE_KEY = 'ryvenca.language';

export type { StoredLanguage };

export async function loadStoredLanguage(): Promise<StoredLanguage | null> {
  try {
    return parseStoredLanguage(globalThis.localStorage?.getItem(LANGUAGE_KEY) ?? null);
  } catch {
    return null;
  }
}

export async function saveStoredLanguage(value: StoredLanguage): Promise<void> {
  try {
    globalThis.localStorage?.setItem(LANGUAGE_KEY, serializeStoredLanguage(value));
  } catch {
    // ignore
  }
}

// The web never reloads for direction changes (the `dir` attribute is switched live).
export async function loadLastDirectionReload(): Promise<number> {
  return 0;
}

export async function saveLastDirectionReload(_at: number): Promise<void> {
  // no-op
}
