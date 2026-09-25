import { isLanguageCode, matchLanguage, type LanguageCode } from './languages';

/**
 * Persisted language choice.
 * - `user`: picked explicitly in the language picker on this device (always wins).
 * - `account`: adopted from `user.language` after login (a later login to another account may replace it).
 */
export interface StoredLanguage {
  code: LanguageCode;
  source: 'user' | 'account';
}

export function parseStoredLanguage(raw: string | null | undefined): StoredLanguage | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      const { code, source } = parsed as { code?: unknown; source?: unknown };
      if (isLanguageCode(code)) return { code, source: source === 'account' ? 'account' : 'user' };
    }
  } catch {
    // Older/plain value, e.g. "de".
  }
  const plain = matchLanguage(raw);
  return plain ? { code: plain, source: 'user' } : null;
}

export function serializeStoredLanguage(value: StoredLanguage): string {
  return JSON.stringify(value);
}
