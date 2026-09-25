/**
 * Guarded `Intl.PluralRules` fallback.
 *
 * i18next resolves `_one` / `_other` / `_few`… suffixes with `Intl.PluralRules`. Hermes does not
 * implement `Intl.PluralRules` on every platform/version; without it i18next silently falls back to an
 * English-only rule (breaking Russian, Arabic, … plurals). `ensurePluralRules()` installs this small
 * CLDR-based implementation for the 16 supported languages only when the engine lacks a working one.
 *
 * Rules follow CLDR (cardinal) for integers and simple decimals; plural suffixes used in the locale
 * files are therefore: zero, one, two, few, many, other.
 */

export type PluralCategory = 'zero' | 'one' | 'two' | 'few' | 'many' | 'other';

interface Operands {
  /** absolute value */
  n: number;
  /** integer digits */
  i: number;
  /** number of visible fraction digits */
  v: number;
}

function operands(value: number): Operands {
  const n = Math.abs(value);
  const str = String(n);
  const dot = str.indexOf('.');
  return { n, i: Math.floor(n), v: dot >= 0 && !str.includes('e') ? str.length - dot - 1 : 0 };
}

type Rule = (o: Operands) => PluralCategory;

const otherOnly: Rule = () => 'other';

/** "one" for exactly 1 (en, de, tr: `i = 1 and v = 0` / `n = 1`). */
const oneIfOne: Rule = ({ i, v }) => (i === 1 && v === 0 ? 'one' : 'other');

/** Millions get "many" in es/fr/pt (CLDR 42+: e = 0 and i != 0 and i % 1000000 = 0 and v = 0). */
const isMillionMultiple = ({ i, v }: Operands) => v === 0 && i !== 0 && i % 1_000_000 === 0;

const RULES: Record<string, { rule: Rule; categories: PluralCategory[] }> = {
  tr: { rule: ({ n }) => (n === 1 ? 'one' : 'other'), categories: ['one', 'other'] },
  en: { rule: oneIfOne, categories: ['one', 'other'] },
  de: { rule: oneIfOne, categories: ['one', 'other'] },
  zh: { rule: otherOnly, categories: ['other'] },
  ja: { rule: otherOnly, categories: ['other'] },
  ko: { rule: otherOnly, categories: ['other'] },
  vi: { rule: otherOnly, categories: ['other'] },
  id: { rule: otherOnly, categories: ['other'] },
  hi: { rule: ({ n, i }) => (i === 0 || n === 1 ? 'one' : 'other'), categories: ['one', 'other'] },
  bn: { rule: ({ n, i }) => (i === 0 || n === 1 ? 'one' : 'other'), categories: ['one', 'other'] },
  ur: { rule: oneIfOne, categories: ['one', 'other'] },
  es: {
    rule: (o) => (o.n === 1 ? 'one' : isMillionMultiple(o) ? 'many' : 'other'),
    categories: ['one', 'many', 'other'],
  },
  fr: {
    rule: (o) => (o.i === 0 || o.i === 1 ? 'one' : isMillionMultiple(o) ? 'many' : 'other'),
    categories: ['one', 'many', 'other'],
  },
  pt: {
    rule: (o) => (o.i === 0 || o.i === 1 ? 'one' : isMillionMultiple(o) ? 'many' : 'other'),
    categories: ['one', 'many', 'other'],
  },
  ru: {
    rule: ({ i, v }) => {
      if (v !== 0) return 'other';
      const m10 = i % 10;
      const m100 = i % 100;
      if (m10 === 1 && m100 !== 11) return 'one';
      if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return 'few';
      return 'many';
    },
    categories: ['one', 'few', 'many', 'other'],
  },
  ar: {
    rule: ({ n }) => {
      if (n === 0) return 'zero';
      if (n === 1) return 'one';
      if (n === 2) return 'two';
      if (Number.isInteger(n)) {
        const m100 = n % 100;
        if (m100 >= 3 && m100 <= 10) return 'few';
        if (m100 >= 11 && m100 <= 99) return 'many';
      }
      return 'other';
    },
    categories: ['zero', 'one', 'two', 'few', 'many', 'other'],
  },
};

function primary(locale: string | readonly string[] | undefined): string {
  const tag = Array.isArray(locale) ? locale[0] : locale;
  return (typeof tag === 'string' ? tag : 'en').toLowerCase().split(/[-_]/)[0] ?? 'en';
}

/** Minimal cardinal `Intl.PluralRules` replacement for the supported languages. */
export class FallbackPluralRules {
  private readonly lang: string;
  private readonly entry: { rule: Rule; categories: PluralCategory[] };

  constructor(locale?: string | readonly string[], options?: { type?: 'cardinal' | 'ordinal' }) {
    const lang = primary(locale);
    this.lang = RULES[lang] ? lang : 'en';
    // Ordinals are not used by the app; treat them as "other" so i18next never crashes.
    this.entry =
      options?.type === 'ordinal' ? { rule: otherOnly, categories: ['other'] } : (RULES[this.lang] as (typeof RULES)[string]);
  }

  select(value: number): PluralCategory {
    const num = Number(value);
    if (!Number.isFinite(num)) return 'other';
    return this.entry.rule(operands(num));
  }

  resolvedOptions() {
    return { locale: this.lang, type: 'cardinal' as const, pluralCategories: [...this.entry.categories] };
  }

  static supportedLocalesOf(locales: string | readonly string[]): string[] {
    const list = Array.isArray(locales) ? locales : [locales];
    return list.filter((l): l is string => typeof l === 'string' && !!RULES[primary(l)]);
  }
}

/** Categories of our fallback rules (exported for tests and the locale-file checker). */
export function fallbackPluralCategories(lang: string): PluralCategory[] {
  return [...(RULES[primary(lang)] ?? (RULES.en as (typeof RULES)[string])).categories];
}

/** True when the engine's Intl.PluralRules exists and knows Russian/Arabic plural categories. */
export function hasWorkingPluralRules(intl: typeof Intl | undefined = globalThis.Intl): boolean {
  try {
    if (!intl || typeof intl.PluralRules !== 'function') return false;
    return new intl.PluralRules('ru').select(3) === 'few' && new intl.PluralRules('ar').select(2) === 'two';
  } catch {
    return false;
  }
}

/** Installs the fallback on `globalThis.Intl` when needed. Returns true if it was installed. */
export function ensurePluralRules(): boolean {
  if (hasWorkingPluralRules()) return false;
  const g = globalThis as { Intl?: Record<string, unknown> };
  if (!g.Intl) g.Intl = {};
  try {
    Object.defineProperty(g.Intl, 'PluralRules', { value: FallbackPluralRules, configurable: true, writable: true });
  } catch {
    g.Intl.PluralRules = FallbackPluralRules;
  }
  return true;
}
