import {
  FALLBACK_LANGUAGE,
  LANGUAGES,
  LANGUAGE_CODES,
  isRTLLanguage,
  matchDeviceLanguages,
  matchLanguage,
  pickerLanguages,
  resolveLanguage,
} from '../languages';
import { parseStoredLanguage, serializeStoredLanguage } from '../storedLanguage';

describe('matchLanguage', () => {
  it('matches on the primary subtag, case-insensitively', () => {
    expect(matchLanguage('tr')).toBe('tr');
    expect(matchLanguage('tr-TR')).toBe('tr');
    expect(matchLanguage('EN-us')).toBe('en');
    expect(matchLanguage('pt-BR')).toBe('pt');
    expect(matchLanguage('pt_PT')).toBe('pt');
    expect(matchLanguage('de-AT')).toBe('de');
    expect(matchLanguage('ar-EG')).toBe('ar');
    expect(matchLanguage('ur-PK')).toBe('ur');
  });

  it('maps every Chinese variant to Simplified Chinese (zh)', () => {
    expect(matchLanguage('zh')).toBe('zh');
    expect(matchLanguage('zh-CN')).toBe('zh');
    expect(matchLanguage('zh-Hans-CN')).toBe('zh');
    expect(matchLanguage('zh-Hant-TW')).toBe('zh');
    expect(matchLanguage('zh-HK')).toBe('zh');
  });

  it('maps the legacy Android Indonesian code', () => {
    expect(matchLanguage('in-ID')).toBe('id');
    expect(matchLanguage('id-ID')).toBe('id');
  });

  it('returns null for unsupported or empty input', () => {
    expect(matchLanguage('it-IT')).toBeNull();
    expect(matchLanguage('he')).toBeNull();
    expect(matchLanguage('')).toBeNull();
    expect(matchLanguage('   ')).toBeNull();
    expect(matchLanguage(null)).toBeNull();
    expect(matchLanguage(undefined)).toBeNull();
    // "english" is not a subtag we support
    expect(matchLanguage('english')).toBeNull();
  });
});

describe('resolveLanguage', () => {
  it('prefers the saved choice, then the account, then the device, then English', () => {
    expect(resolveLanguage({ saved: 'ja', account: 'de', device: ['fr-FR'] })).toBe('ja');
    expect(resolveLanguage({ saved: null, account: 'de', device: ['fr-FR'] })).toBe('de');
    expect(resolveLanguage({ account: null, device: ['fr-FR', 'en-US'] })).toBe('fr');
    expect(resolveLanguage({ device: [] })).toBe(FALLBACK_LANGUAGE);
    expect(resolveLanguage({})).toBe('en');
  });

  it('skips unsupported values at every level', () => {
    expect(resolveLanguage({ saved: 'xx', account: 'it', device: ['nl-NL', 'ko-KR'] })).toBe('ko');
    expect(resolveLanguage({ saved: 'xx', account: 'it', device: ['nl-NL', 'sv-SE'] })).toBe('en');
  });

  it('uses the first supported device locale in preference order', () => {
    expect(matchDeviceLanguages(['it-IT', 'zh-Hant-HK', 'en-GB'])).toBe('zh');
    expect(matchDeviceLanguages([null, undefined, ''])).toBeNull();
  });
});

describe('language list', () => {
  it('has the 16 supported languages with native names and RTL flags', () => {
    expect(LANGUAGE_CODES).toHaveLength(16);
    expect(LANGUAGES.map((l) => l.code)).toEqual([...LANGUAGE_CODES]);
    expect(LANGUAGES.filter((l) => l.rtl).map((l) => l.code)).toEqual(['ar', 'ur']);
    expect(LANGUAGES.every((l) => l.nativeName.trim().length > 0)).toBe(true);
    expect(isRTLLanguage('ar')).toBe(true);
    expect(isRTLLanguage('ur')).toBe(true);
    expect(isRTLLanguage('tr')).toBe(false);
    expect(isRTLLanguage(undefined)).toBe(false);
  });

  it('pickerLanguages works without /api/meta and merges server labels for known codes only', () => {
    expect(pickerLanguages(undefined)).toEqual([...LANGUAGES]);
    expect(pickerLanguages([])).toEqual([...LANGUAGES]);
    const merged = pickerLanguages([
      { code: 'de', label: 'Deutsch (DE)', rtl: false },
      { code: 'xx', label: 'Unknown', rtl: true },
      { code: 'ar', label: '', rtl: 'yes' },
    ]);
    expect(merged).toHaveLength(16);
    expect(merged.find((l) => l.code === 'de')?.nativeName).toBe('Deutsch (DE)');
    expect(merged.find((l) => l.code === 'ar')).toMatchObject({ nativeName: 'العربية', rtl: true });
    expect(merged.some((l) => (l.code as string) === 'xx')).toBe(false);
  });
});

describe('stored language', () => {
  it('round-trips and tolerates legacy / malformed values', () => {
    expect(parseStoredLanguage(serializeStoredLanguage({ code: 'ar', source: 'user' }))).toEqual({ code: 'ar', source: 'user' });
    expect(parseStoredLanguage(serializeStoredLanguage({ code: 'ja', source: 'account' }))).toEqual({
      code: 'ja',
      source: 'account',
    });
    expect(parseStoredLanguage('de')).toEqual({ code: 'de', source: 'user' });
    expect(parseStoredLanguage('{"code":"xx"}')).toBeNull();
    expect(parseStoredLanguage('not json')).toBeNull();
    expect(parseStoredLanguage(null)).toBeNull();
  });
});
