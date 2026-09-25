import type {
  Category,
  CategoryMeta,
  ColorMeta,
  ColorName,
  LabeledCode,
  Meta,
  Occasion,
  Season,
  StyleMeta,
  StylePreference,
  WardrobeType,
} from '../api/types';

/** Fallback when a code is unknown to meta: "LIGHT_BLUE" → "Light blue". */
export function humanizeCode(code: string): string {
  const words = code.toLowerCase().split('_').filter(Boolean).join(' ');
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : code;
}

export function labelFrom<C extends string>(list: readonly LabeledCode<C>[] | undefined, code: C | null | undefined): string {
  if (!code) return '';
  return list?.find((item) => item.code === code)?.label ?? humanizeCode(code);
}

export interface MetaLabels {
  wardrobeType: (code: WardrobeType | null | undefined) => string;
  style: (code: StylePreference | null | undefined) => string;
  category: (code: Category | null | undefined) => string;
  categoryPlural: (code: Category | null | undefined) => string;
  subcategory: (code: string | null | undefined, category?: Category) => string;
  color: (code: ColorName | null | undefined) => string;
  colorHex: (code: ColorName | null | undefined) => string;
  season: (code: Season | null | undefined) => string;
  occasion: (code: Occasion | null | undefined) => string;
  seasons: (codes: readonly Season[]) => string;
  occasions: (codes: readonly Occasion[]) => string;
}

const NEUTRAL_HEX = '#C4B196';

/** Builds label lookup helpers from `/api/meta`. Labels are never hard-coded in the client. */
export function buildLabels(meta: Meta | undefined): MetaLabels {
  const subIndex = new Map<string, string>();
  for (const cat of meta?.categories ?? []) {
    for (const sub of cat.subcategories) {
      subIndex.set(`${cat.code}:${sub.code}`, sub.label);
      if (!subIndex.has(sub.code)) subIndex.set(sub.code, sub.label);
    }
  }
  const colorByCode = new Map<string, ColorMeta>((meta?.colors ?? []).map((c) => [c.code, c]));
  const categoryByCode = new Map<string, CategoryMeta>((meta?.categories ?? []).map((c) => [c.code, c]));

  return {
    wardrobeType: (code) => labelFrom(meta?.wardrobeTypes, code),
    style: (code) => labelFrom<StylePreference>(meta?.styles as LabeledCode<StylePreference>[] | undefined, code),
    category: (code) => labelFrom(meta?.categories as LabeledCode<Category>[] | undefined, code),
    categoryPlural: (code) => (code ? categoryByCode.get(code)?.pluralLabel ?? humanizeCode(code) : ''),
    subcategory: (code, category) => {
      if (!code) return '';
      return (category && subIndex.get(`${category}:${code}`)) || subIndex.get(code) || humanizeCode(code);
    },
    color: (code) => (code ? colorByCode.get(code)?.label ?? humanizeCode(code) : ''),
    colorHex: (code) => (code ? colorByCode.get(code)?.hex ?? NEUTRAL_HEX : NEUTRAL_HEX),
    season: (code) => labelFrom(meta?.seasons, code),
    occasion: (code) => labelFrom(meta?.occasions, code),
    seasons: (codes) => codes.map((c) => labelFrom(meta?.seasons, c)).join(', '),
    occasions: (codes) => codes.map((c) => labelFrom(meta?.occasions, c)).join(', '),
  };
}

export function subcategoriesFor(meta: Meta | undefined, category: Category | null | undefined): LabeledCode[] {
  if (!meta || !category) return [];
  return meta.categories.find((c) => c.code === category)?.subcategories ?? [];
}

export function stylesWithDescriptions(meta: Meta | undefined): StyleMeta[] {
  return meta?.styles ?? [];
}

/** Detection confidence bucket; the UI shows `upload.form.confidence.<level>`. */
export type ConfidenceLevel = 'high' | 'medium' | 'low';

/** Detection confidence → level. Thresholds: ≥ 0.7 high, ≥ 0.45 medium, otherwise low. */
export function confidenceLevel(confidence: number): ConfidenceLevel {
  if (!Number.isFinite(confidence)) return 'low';
  if (confidence >= 0.7) return 'high';
  if (confidence >= 0.45) return 'medium';
  return 'low';
}

/** Score clamped to 0–100 and rounded (display is localized with formatPercent / formatNumber). */
export function clampScore(score: number): number {
  if (!Number.isFinite(score)) return 0;
  return Math.max(0, Math.min(100, Math.round(score)));
}

/** Readiness progress fraction (0–1), e.g. 3 of 8 recommended pieces. */
export function readinessProgress(garmentCount: number, recommendedMinimum: number): number {
  if (recommendedMinimum <= 0) return 1;
  return Math.max(0, Math.min(1, garmentCount / recommendedMinimum));
}

/**
 * First letter for the avatar circle, upper-cased with the UI locale (Turkish "i" → "İ").
 * Uses the first code point so non-BMP characters are not split.
 */
export function initialOf(name: string | null | undefined, locale = 'tr', fallback = 'R'): string {
  const trimmed = (name ?? '').trim();
  if (!trimmed) return fallback;
  const first = Array.from(trimmed)[0] ?? fallback;
  try {
    return first.toLocaleUpperCase(locale);
  } catch {
    return first.toUpperCase();
  }
}

/** Toggles a value in a list, returning a new array (keeps original order for existing items). */
export function toggleInList<T>(list: readonly T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}
