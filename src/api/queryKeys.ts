import type { GarmentFilters, Occasion, Season, SuggestionsParams } from './types';

/** Central react-query keys. Top-level segments are used for broad invalidation. */
export const queryKeys = {
  meta: ['meta'] as const,
  me: ['me'] as const,
  home: ['home'] as const,
  garments: {
    all: ['garments'] as const,
    list: (filters: GarmentFilters) => ['garments', 'list', filters] as const,
    detail: (id: number) => ['garments', 'detail', id] as const,
    pairings: (id: number, params: { season?: Season | null; occasion?: Occasion | null } = {}) =>
      ['garments', 'pairings', id, params] as const,
  },
  outfits: {
    all: ['outfits'] as const,
    suggestions: (params: SuggestionsParams) => ['outfits', 'suggestions', params] as const,
    evaluate: (ids: readonly number[]) => ['outfits', 'evaluate', ids.join(',')] as const,
    similar: (ids: readonly number[]) => ['outfits', 'similar', ids.join(',')] as const,
    saved: ['outfits', 'saved'] as const,
  },
};
