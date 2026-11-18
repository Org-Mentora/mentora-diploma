import { useMemo } from 'react';
import { ApiErrorAdapter, type UiError } from '@/model/api/ApiErrorAdapter';
import { useGetRecordAccessLogQuery } from '@/model/api/generated/mentoraApi';
import { usePagedQuery } from '@/model/api/usePagedQuery';
import {
  RecordAccessAdapter,
  type RecordAccessItem,
} from '@/model/domain/clinical-records/RecordAccessAdapter';

export interface RecordAccessLogViewModel {
  items: RecordAccessItem[];
  isLoading: boolean;
  hasMore: boolean;
  isLoadingMore: boolean;
  loadMore: () => void;
  error: UiError | null;
}

// ViewModel
export function useRecordAccessLogViewModel(patientId: string): RecordAccessLogViewModel {
  const list = usePagedQuery(useGetRecordAccessLogQuery, { patientId });
  const items = useMemo(() => RecordAccessAdapter.toItems(list.items), [list.items]);
  return {
    items,
    isLoading: list.isLoading,
    hasMore: list.hasMore,
    isLoadingMore: list.isLoadingMore,
    loadMore: list.loadMore,
    error: ApiErrorAdapter.toUiError(list.error),
  };
}
