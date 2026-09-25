import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { api, queryKeys } from '../api';
import type { GarmentFilters, Occasion, Season, SuggestionsParams } from '../api/types';
import { useLanguage } from '../i18n';

// Every hook below keys its cache by the UI language: the server renders labels/texts per language
// (Accept-Language), so a language switch refetches instead of showing stale text.

export function useHome() {
  const { language } = useLanguage();
  return useQuery({ queryKey: queryKeys.home(language), queryFn: api.getHome });
}

export function useGarments(filters: GarmentFilters = {}, options: { enabled?: boolean } = {}) {
  const { language } = useLanguage();
  return useQuery({
    queryKey: queryKeys.garments.list(filters, language),
    queryFn: () => api.getGarments(filters),
    placeholderData: keepPreviousData,
    enabled: options.enabled ?? true,
  });
}

export function useGarment(id: number) {
  const { language } = useLanguage();
  return useQuery({ queryKey: queryKeys.garments.detail(id, language), queryFn: () => api.getGarment(id) });
}

export function usePairings(id: number, params: { season?: Season | null; occasion?: Occasion | null } = {}) {
  const { language } = useLanguage();
  return useQuery({
    queryKey: queryKeys.garments.pairings(id, params, language),
    queryFn: () => api.getPairings(id, params),
  });
}

export function useSuggestions(params: SuggestionsParams) {
  const { language } = useLanguage();
  return useQuery({
    queryKey: queryKeys.outfits.suggestions(params, language),
    queryFn: () => api.getSuggestions(params),
    placeholderData: keepPreviousData,
  });
}

export function useEvaluateOutfit(ids: readonly number[]) {
  const { language } = useLanguage();
  return useQuery({
    queryKey: queryKeys.outfits.evaluate(ids, language),
    queryFn: () => api.evaluateOutfit(ids),
    enabled: ids.length > 0,
  });
}

export function useSimilarOutfits(ids: readonly number[], enabled: boolean) {
  const { language } = useLanguage();
  return useQuery({
    queryKey: queryKeys.outfits.similar(ids, language),
    queryFn: () => api.getSimilarOutfits(ids, 6),
    enabled: enabled && ids.length > 0,
  });
}

export function useSavedOutfits() {
  const { language } = useLanguage();
  return useQuery({ queryKey: queryKeys.outfits.saved(language), queryFn: api.getSavedOutfits });
}
