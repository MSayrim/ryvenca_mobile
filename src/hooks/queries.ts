import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { api, queryKeys } from '../api';
import type { GarmentFilters, Occasion, Season, SuggestionsParams } from '../api/types';

export function useHome() {
  return useQuery({ queryKey: queryKeys.home, queryFn: api.getHome });
}

export function useGarments(filters: GarmentFilters = {}, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.garments.list(filters),
    queryFn: () => api.getGarments(filters),
    placeholderData: keepPreviousData,
    enabled: options.enabled ?? true,
  });
}

export function useGarment(id: number) {
  return useQuery({ queryKey: queryKeys.garments.detail(id), queryFn: () => api.getGarment(id) });
}

export function usePairings(id: number, params: { season?: Season | null; occasion?: Occasion | null } = {}) {
  return useQuery({
    queryKey: queryKeys.garments.pairings(id, params),
    queryFn: () => api.getPairings(id, params),
  });
}

export function useSuggestions(params: SuggestionsParams) {
  return useQuery({
    queryKey: queryKeys.outfits.suggestions(params),
    queryFn: () => api.getSuggestions(params),
    placeholderData: keepPreviousData,
  });
}

export function useEvaluateOutfit(ids: readonly number[]) {
  return useQuery({
    queryKey: queryKeys.outfits.evaluate(ids),
    queryFn: () => api.evaluateOutfit(ids),
    enabled: ids.length > 0,
  });
}

export function useSimilarOutfits(ids: readonly number[], enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.outfits.similar(ids),
    queryFn: () => api.getSimilarOutfits(ids, 6),
    enabled: enabled && ids.length > 0,
  });
}

export function useSavedOutfits() {
  return useQuery({ queryKey: queryKeys.outfits.saved, queryFn: api.getSavedOutfits });
}
