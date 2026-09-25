import * as SecureStore from 'expo-secure-store';

import { parseStoredLanguage, serializeStoredLanguage, type StoredLanguage } from './storedLanguage';

const LANGUAGE_KEY = 'ryvenca.language';
const RELOAD_KEY = 'ryvenca.rtlReloadAt';

export type { StoredLanguage };

export async function loadStoredLanguage(): Promise<StoredLanguage | null> {
  try {
    return parseStoredLanguage(await SecureStore.getItemAsync(LANGUAGE_KEY));
  } catch {
    return null;
  }
}

export async function saveStoredLanguage(value: StoredLanguage): Promise<void> {
  try {
    await SecureStore.setItemAsync(LANGUAGE_KEY, serializeStoredLanguage(value));
  } catch {
    // Non-fatal: the choice still applies for this session.
  }
}

/** Timestamp (ms) of the last automatic reload done to fix the layout direction (loop guard). */
export async function loadLastDirectionReload(): Promise<number> {
  try {
    return Number((await SecureStore.getItemAsync(RELOAD_KEY)) ?? 0) || 0;
  } catch {
    return 0;
  }
}

export async function saveLastDirectionReload(at: number): Promise<void> {
  try {
    await SecureStore.setItemAsync(RELOAD_KEY, String(at));
  } catch {
    // ignore
  }
}
