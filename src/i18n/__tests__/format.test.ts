import { formatNumber, formatPercent, toUpperLocale } from '../format';
import { i18n } from '../i18n';

describe('formatPercent', () => {
  it('uses the locale percent pattern', () => {
    expect(formatPercent(92, 'tr')).toBe('%92');
    expect(formatPercent(92, 'en')).toBe('92%');
    // German puts a (non-breaking) space before the sign.
    expect(formatPercent(92, 'de')).toMatch(/^92\s%$/u);
    expect(formatPercent(92, 'fr')).toMatch(/^92\s%$/u);
    // Arabic: CLDR's default numbering (Latin or Arabic-Indic digits, depending on the ICU version).
    expect(formatPercent(92, 'ar')).toMatch(/(92|٩٢)/);
    expect(formatPercent(92, 'ar')).toMatch(/[%٪]/);
  });

  it('rounds and handles edge values', () => {
    expect(formatPercent(91.6, 'en')).toBe('92%');
    expect(formatPercent(0, 'tr')).toBe('%0');
    expect(formatPercent(100, 'en')).toBe('100%');
    expect(formatPercent(Number.NaN, 'en')).toBe('0%');
  });

  it('falls back gracefully when Intl.NumberFormat is unavailable', () => {
    const original = Intl.NumberFormat;
    try {
      // @ts-expect-error simulate an engine without NumberFormat
      Intl.NumberFormat = undefined;
      // Use languages whose formatter is not cached yet in this test file.
      expect(formatPercent(7, 'vi')).toBe('7%');
      expect(formatNumber(1234, 'id')).toBe('1234');
    } finally {
      Intl.NumberFormat = original;
    }
  });
});

describe('formatNumber / toUpperLocale', () => {
  it('formats counts with locale digits and grouping', () => {
    expect(formatNumber(1234, 'en')).toBe('1,234');
    expect(formatNumber(1234, 'de')).toBe('1.234');
    expect(formatNumber(12, 'bn')).toBe('১২');
    expect(formatNumber(12, 'ar-u-nu-arab')).toBe('١٢');
  });

  it('upper-cases with language rules', () => {
    expect(toUpperLocale('adım', 'tr')).toBe('ADIM');
    expect(toUpperLocale('bilgi', 'tr')).toBe('BİLGİ');
    expect(toUpperLocale('bilgi', 'en')).toBe('BILGI');
    expect(toUpperLocale('日本語', 'ja')).toBe('日本語');
  });
});

describe('t() interpolation', () => {
  afterEach(async () => {
    await i18n.changeLanguage('tr');
  });

  it('pluralizes and formats numbers for the active language', async () => {
    await i18n.changeLanguage('en');
    expect(i18n.t('wardrobe.count', { count: 1 })).toBe('1 piece');
    expect(i18n.t('wardrobe.count', { count: 1234 })).toBe('1,234 pieces');
    expect(i18n.t('outfit.scorePill', { percent: formatPercent(92, 'en') })).toBe('Match 92%');

    await i18n.changeLanguage('tr');
    expect(i18n.t('wardrobe.count', { count: 3 })).toBe('3 parça');
    expect(i18n.t('outfit.scorePill', { percent: formatPercent(92, 'tr') })).toBe('Uyum %92');
    expect(i18n.t('readiness.title', { min: 5, max: 10 })).toBe('Kombin önerileri için 5–10 parça ekle');
  });

  it('falls back to English for keys a translation does not have', async () => {
    await i18n.changeLanguage('ja');
    // ja.json is currently an English copy; numbers still use the ja locale formatter.
    expect(i18n.t('suggestions.summary', { count: 2, season: 'Spring' })).toBe('2 outfits · Spring');
  });
});
