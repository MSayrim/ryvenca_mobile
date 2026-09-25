import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { api, queryKeys } from '../api';
import type { Meta } from '../api/types';
import { useLanguage } from '../i18n';
import { buildLabels, type MetaLabels } from '../utils/labels';

/** `/api/meta` — fetched once per language per app session and cached forever. */
export function useMetaQuery() {
  const { language } = useLanguage();
  return useQuery<Meta>({
    queryKey: queryKeys.meta(language),
    queryFn: api.getMeta,
    staleTime: Infinity,
    gcTime: Infinity,
    // While the new language loads, keep showing the previous labels instead of skeletons.
    placeholderData: (previous) => previous,
  });
}

export interface UseMetaResult {
  meta: Meta | undefined;
  labels: MetaLabels;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

/** Meta plus label helpers. All enum labels in the UI must come from here. */
export function useMeta(): UseMetaResult {
  const query = useMetaQuery();
  const labels = useMemo(() => buildLabels(query.data), [query.data]);
  return {
    meta: query.data,
    labels,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: () => void query.refetch(),
  };
}
