import type { GarmentFilters, Occasion, Season, SuggestionsParams } from './types';

/**
 * Central react-query keys. Top-level segments are used for broad invalidation.
 *
 * Every query whose payload contains server-rendered text (labels, generated names, outfit titles,
 * reasons, readiness messages…) carries the UI language as its LAST segment, so switching the language
 * refetches localized data while prefix-based invalidation/removal (e.g. `['garments', 'detail', id]`)
 * still matches every language.
 */
export const queryKeys = {
  meta: (lang: string) => ['meta', lang] as const,
  me: ['me'] as const,
  home: (lang: string) => ['home', lang] as const,
  homeAll: ['home'] as const,
  garments: {
    all: ['garments'] as const,
    lists: ['garments', 'list'] as const,
    list: (filters: GarmentFilters, lang: string) => ['garments', 'list', filters, lang] as const,
    detailAll: (id: number) => ['garments', 'detail', id] as const,
    detail: (id: number, lang: string) => ['garments', 'detail', id, lang] as const,
    pairingsAll: (id: number) => ['garments', 'pairings', id] as const,
    pairings: (id: number, params: { season?: Season | null; occasion?: Occasion | null }, lang: string) =>
      ['garments', 'pairings', id, params, lang] as const,
  },
  outfits: {
    all: ['outfits'] as const,
    suggestions: (params: SuggestionsParams, lang: string) => ['outfits', 'suggestions', params, lang] as const,
    evaluate: (ids: readonly number[], lang: string) => ['outfits', 'evaluate', ids.join(','), lang] as const,
    similar: (ids: readonly number[], lang: string) => ['outfits', 'similar', ids.join(','), lang] as const,
    savedAll: ['outfits', 'saved'] as const,
    saved: (lang: string) => ['outfits', 'saved', lang] as const,
  },
};
