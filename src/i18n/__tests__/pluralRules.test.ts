import { createInstance } from 'i18next';

import { LANGUAGE_CODES } from '../languages';
import { FallbackPluralRules, ensurePluralRules, fallbackPluralCategories, hasWorkingPluralRules } from '../pluralRules';

const SAMPLES = [
  ...Array.from({ length: 230 }, (_, i) => i),
  1000,
  1001,
  1_000_000,
  2_000_000,
  1_000_001,
  0.5,
  1.5,
  2.5,
  3.25,
];

describe('FallbackPluralRules', () => {
  it.each([...LANGUAGE_CODES])('matches the CLDR rules of the engine for %s', (lang) => {
    const reference = new Intl.PluralRules(lang);
    const fallback = new FallbackPluralRules(lang);
    for (const n of SAMPLES) {
      expect(`${n}:${fallback.select(n)}`).toBe(`${n}:${reference.select(n)}`);
    }
    expect([...fallback.resolvedOptions().pluralCategories].sort()).toEqual(
      [...reference.resolvedOptions().pluralCategories].sort(),
    );
    expect(fallbackPluralCategories(lang).sort()).toEqual([...reference.resolvedOptions().pluralCategories].sort());
  });

  it('handles regional tags, unknown languages and ordinals', () => {
    expect(new FallbackPluralRules('ru-RU').select(3)).toBe('few');
    expect(new FallbackPluralRules('xx').select(1)).toBe('one');
    expect(new FallbackPluralRules('en', { type: 'ordinal' }).select(2)).toBe('other');
    expect(new FallbackPluralRules('ar').select(Number.NaN)).toBe('other');
  });

  it('detects engines without a usable Intl.PluralRules', () => {
    expect(hasWorkingPluralRules()).toBe(true);
    expect(hasWorkingPluralRules({} as typeof Intl)).toBe(false);
    expect(hasWorkingPluralRules(undefined)).toBe(true); // falls back to globalThis.Intl
    expect(ensurePluralRules()).toBe(false); // Node has full ICU → nothing installed
  });

  it('lets i18next resolve Russian/Arabic plural suffixes when installed as Intl.PluralRules', async () => {
    const original = Intl.PluralRules;
    try {
      (Intl as { PluralRules: unknown }).PluralRules = FallbackPluralRules;
      const instance = createInstance();
      await instance.init({
        lng: 'ru',
        resources: {
          ru: { translation: { n_one: '{{count}} вещь', n_few: '{{count}} вещи', n_many: '{{count}} вещей', n_other: '{{count}} вещи' } },
          ar: { translation: { n_zero: 'لا قطع', n_one: 'قطعة', n_two: 'قطعتان', n_few: 'few', n_many: 'many', n_other: 'other' } },
        },
      });
      // Untyped t: these ad-hoc keys are not part of the app's typed resources.
      const t = instance.t as unknown as (key: string, options: { count: number }) => string;
      expect(t('n', { count: 1 })).toBe('1 вещь');
      expect(t('n', { count: 3 })).toBe('3 вещи');
      expect(t('n', { count: 5 })).toBe('5 вещей');
      await instance.changeLanguage('ar');
      expect(t('n', { count: 0 })).toBe('لا قطع');
      expect(t('n', { count: 2 })).toBe('قطعتان');
      expect(t('n', { count: 11 })).toBe('many');
    } finally {
      (Intl as { PluralRules: unknown }).PluralRules = original;
    }
  });
});
