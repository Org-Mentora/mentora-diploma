import { useMemo } from 'react';
import { ApiErrorAdapter, type UiError } from '@/model/api/ApiErrorAdapter';
import { useGetDiagnosisHistoryQuery } from '@/model/api/generated/mentoraApi';
import { usePagedQuery } from '@/model/api/usePagedQuery';
import {
  ClinicalRecordAdapter,
  type DiagnosisHistoryItem,
} from '@/model/domain/clinical-records/ClinicalRecordAdapter';

export interface DiagnosisHistoryViewModel {
  items: DiagnosisHistoryItem[];
  isLoading: boolean;
  hasMore: boolean;
  isLoadingMore: boolean;
  loadMore: () => void;
  error: UiError | null;
}

// ViewModel
export function useDiagnosisHistoryViewModel(patientId: string): DiagnosisHistoryViewModel {
  const list = usePagedQuery(useGetDiagnosisHistoryQuery, { patientId });
  const items = useMemo(() => ClinicalRecordAdapter.toDiagnosisHistory(list.items), [list.items]);
  return {
    items,
    isLoading: list.isLoading,
    hasMore: list.hasMore,
    isLoadingMore: list.isLoadingMore,
    loadMore: list.loadMore,
    error: ApiErrorAdapter.toUiError(list.error),
  };
}
