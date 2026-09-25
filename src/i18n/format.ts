/**
 * Locale-aware number / percent / date formatting (pure; unit tested).
 *
 * Uses `Intl` when available (Hermes ships NumberFormat/DateTimeFormat) and degrades to simple
 * Latin-digit output if a formatter is missing or throws.
 */

const numberFormatters = new Map<string, Intl.NumberFormat | null>();

function numberFormatter(lang: string, options: Intl.NumberFormatOptions, cacheKey: string): Intl.NumberFormat | null {
  const key = `${lang}|${cacheKey}`;
  if (numberFormatters.has(key)) return numberFormatters.get(key) ?? null;
  let formatter: Intl.NumberFormat | null = null;
  try {
    if (typeof Intl !== 'undefined' && typeof Intl.NumberFormat === 'function') {
      formatter = new Intl.NumberFormat(lang, options);
    }
  } catch {
    formatter = null;
  }
  numberFormatters.set(key, formatter);
  return formatter;
}

/** Languages whose percent sign conventionally precedes the number (fallback only). */
const PERCENT_PREFIX = new Set(['tr']);

/**
 * Formats a 0–100 value as a percentage: tr "%92", en "92%", de "92 %", ar "٩٢٪".
 * Non-finite input is treated as 0; the value is rounded to an integer.
 */
export function formatPercent(value: number, lang: string): string {
  const rounded = Number.isFinite(value) ? Math.round(value) : 0;
  const formatter = numberFormatter(lang, { style: 'percent', maximumFractionDigits: 0 }, 'percent');
  if (formatter) {
    try {
      return formatter.format(rounded / 100);
    } catch {
      // fall through
    }
  }
  return PERCENT_PREFIX.has(lang) ? `%${rounded}` : `${rounded}%`;
}

/** Formats an integer count with locale digits/grouping: en "1,234", de "1.234", ar "١٬٢٣٤". */
export function formatNumber(value: number, lang: string): string {
  const num = Number.isFinite(value) ? value : 0;
  const formatter = numberFormatter(lang, { maximumFractionDigits: 0 }, 'integer');
  if (formatter) {
    try {
      return formatter.format(num);
    } catch {
      // fall through
    }
  }
  return String(Math.round(num));
}

/** Formats a date (ISO string or Date) as a medium date in the given language. */
export function formatDate(value: string | number | Date, lang: string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  try {
    return new Intl.DateTimeFormat(lang, { year: 'numeric', month: 'long', day: 'numeric' }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

/** Language-aware upper-casing (Turkish "i" → "İ"); scripts without case are returned unchanged. */
export function toUpperLocale(text: string, lang: string): string {
  try {
    return text.toLocaleUpperCase(lang);
  } catch {
    return text.toUpperCase();
  }
}
