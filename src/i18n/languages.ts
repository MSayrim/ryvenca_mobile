/**
 * Supported UI languages (see docs/API.md "Languages (i18n)").
 *
 * This list is static on purpose: the language picker must work before `/api/meta` has loaded
 * (e.g. on the auth screen while offline). Native names are the same in every UI language.
 *
 * Pure module (no React Native imports) so it can be unit tested.
 */

export const LANGUAGE_CODES = [
  'tr',
  'en',
  'zh',
  'hi',
  'es',
  'ar',
  'fr',
  'bn',
  'pt',
  'ru',
  'id',
  'ur',
  'de',
  'ja',
  'vi',
  'ko',
] as const;

export type LanguageCode = (typeof LANGUAGE_CODES)[number];

/** Product/source language (tr.json is the source of truth). */
export const SOURCE_LANGUAGE: LanguageCode = 'tr';

/** Used when neither a saved choice, the account nor the device gives a supported language. */
export const FALLBACK_LANGUAGE: LanguageCode = 'en';

export interface LanguageInfo {
  code: LanguageCode;
  /** Native name, shown in the picker. */
  nativeName: string;
  /** English name (secondary line in the picker, search/debugging). */
  englishName: string;
  rtl: boolean;
}

export const LANGUAGES: readonly LanguageInfo[] = [
  { code: 'tr', nativeName: 'Türkçe', englishName: 'Turkish', rtl: false },
  { code: 'en', nativeName: 'English', englishName: 'English', rtl: false },
  { code: 'zh', nativeName: '简体中文', englishName: 'Chinese (Simplified)', rtl: false },
  { code: 'hi', nativeName: 'हिन्दी', englishName: 'Hindi', rtl: false },
  { code: 'es', nativeName: 'Español', englishName: 'Spanish', rtl: false },
  { code: 'ar', nativeName: 'العربية', englishName: 'Arabic', rtl: true },
  { code: 'fr', nativeName: 'Français', englishName: 'French', rtl: false },
  { code: 'bn', nativeName: 'বাংলা', englishName: 'Bengali', rtl: false },
  { code: 'pt', nativeName: 'Português', englishName: 'Portuguese', rtl: false },
  { code: 'ru', nativeName: 'Русский', englishName: 'Russian', rtl: false },
  { code: 'id', nativeName: 'Bahasa Indonesia', englishName: 'Indonesian', rtl: false },
  { code: 'ur', nativeName: 'اردو', englishName: 'Urdu', rtl: true },
  { code: 'de', nativeName: 'Deutsch', englishName: 'German', rtl: false },
  { code: 'ja', nativeName: '日本語', englishName: 'Japanese', rtl: false },
  { code: 'vi', nativeName: 'Tiếng Việt', englishName: 'Vietnamese', rtl: false },
  { code: 'ko', nativeName: '한국어', englishName: 'Korean', rtl: false },
];

const BY_CODE = new Map<string, LanguageInfo>(LANGUAGES.map((l) => [l.code, l]));

/** Legacy / alias primary subtags → supported code (Android still reports Indonesian as "in"). */
const ALIASES: Readonly<Record<string, LanguageCode>> = {
  in: 'id',
};

export function isLanguageCode(value: unknown): value is LanguageCode {
  return typeof value === 'string' && BY_CODE.has(value);
}

export function languageInfo(code: LanguageCode): LanguageInfo {
  return BY_CODE.get(code) ?? (BY_CODE.get(FALLBACK_LANGUAGE) as LanguageInfo);
}

export function isRTLLanguage(code: string | null | undefined): boolean {
  return !!code && BY_CODE.get(code)?.rtl === true;
}

/**
 * Maps any BCP-47-ish tag to a supported language by its primary subtag:
 * "zh-Hant-TW" → "zh", "pt_BR" → "pt", "EN" → "en", "in-ID" → "id". Unsupported → null.
 */
export function matchLanguage(tag: string | null | undefined): LanguageCode | null {
  if (!tag || typeof tag !== 'string') return null;
  const primary = tag.trim().toLowerCase().split(/[-_]/)[0] ?? '';
  if (!primary) return null;
  if (isLanguageCode(primary)) return primary;
  return ALIASES[primary] ?? null;
}

/** First supported language among the device's preferred locales (in preference order). */
export function matchDeviceLanguages(tags: readonly (string | null | undefined)[]): LanguageCode | null {
  for (const tag of tags) {
    const match = matchLanguage(tag);
    if (match) return match;
  }
  return null;
}

export interface LanguageSources {
  /** Choice persisted on this device. */
  saved?: string | null;
  /** `user.language` from `/api/me` (only known after login / session restore). */
  account?: string | null;
  /** Device locales, most preferred first (expo-localization `getLocales()` language tags). */
  device?: readonly (string | null | undefined)[];
}

/** Resolution order: saved choice → account language → device locales → English. */
export function resolveLanguage({ saved, account, device = [] }: LanguageSources): LanguageCode {
  return matchLanguage(saved) ?? matchLanguage(account) ?? matchDeviceLanguages(device) ?? FALLBACK_LANGUAGE;
}

/**
 * Languages offered by the picker. The static list is authoritative (the app only ships these
 * translations); when `/api/meta` returns `languages`, their labels/rtl flags are used for codes we
 * support. Missing or malformed server data is ignored.
 */
export function pickerLanguages(
  server?: readonly { code?: unknown; label?: unknown; rtl?: unknown }[] | null,
): LanguageInfo[] {
  if (!Array.isArray(server) || server.length === 0) return [...LANGUAGES];
  const serverByCode = new Map<string, { label?: unknown; rtl?: unknown }>();
  for (const entry of server) {
    if (entry && typeof entry.code === 'string') serverByCode.set(entry.code, entry);
  }
  return LANGUAGES.map((lang) => {
    const s = serverByCode.get(lang.code);
    if (!s) return lang;
    return {
      ...lang,
      nativeName: typeof s.label === 'string' && s.label.trim() ? s.label : lang.nativeName,
      rtl: typeof s.rtl === 'boolean' ? s.rtl : lang.rtl,
    };
  });
}
