import { useMemo } from 'react';
import { ApiErrorAdapter, type UiError } from '@/model/api/ApiErrorAdapter';
import { useGetHealthQuery } from '@/model/api/generated/mentoraApi';
import { HealthAdapter, type HealthUiModel } from '@/model/domain/health/HealthAdapter';

export interface HealthViewModel {
  health: HealthUiModel | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: UiError | null;
  refresh: () => void;
}

const POLLING_INTERVAL_MS = 30_000;

/**
 * ViewModel (MVVM): binds the generated RTK Query hook to UI-ready state and commands.
 * The View consumes only this object, never the API or the store.
 */
export function useHealthViewModel(): HealthViewModel {
  const { data, error, isLoading, isFetching, refetch } = useGetHealthQuery(undefined, {
    pollingInterval: POLLING_INTERVAL_MS,
  });

  const health = useMemo(() => (data ? HealthAdapter.toUiModel(data) : null), [data]);

  return {
    health,
    isLoading,
    isRefreshing: isFetching && !isLoading,
    error: ApiErrorAdapter.toUiError(error),
    refresh: () => {
      void refetch();
    },
  };
}
