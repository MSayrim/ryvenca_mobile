import { useCallback, useState } from 'react';

/**
 * Local "pulling" state for RefreshControl, so background refetches (e.g. after a mutation
 * invalidates the query) don't show the pull-to-refresh spinner.
 */
export function usePullToRefresh(refetch: () => Promise<unknown>) {
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    refetch().finally(() => setRefreshing(false));
  }, [refetch]);
  return { refreshing, onRefresh };
}
