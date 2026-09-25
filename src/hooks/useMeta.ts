import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { api, queryKeys } from '../api';
import type { Meta } from '../api/types';
import { buildLabels, type MetaLabels } from '../utils/labels';

/** `/api/meta` — fetched once per app session and cached forever. */
export function useMetaQuery() {
  return useQuery<Meta>({
    queryKey: queryKeys.meta,
    queryFn: api.getMeta,
    staleTime: Infinity,
    gcTime: Infinity,
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
