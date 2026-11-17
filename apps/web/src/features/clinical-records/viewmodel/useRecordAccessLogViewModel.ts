import { useMemo } from 'react';
import { ApiErrorAdapter, type UiError } from '@/model/api/ApiErrorAdapter';
import { useGetRecordAccessLogQuery } from '@/model/api/generated/mentoraApi';
import {
  RecordAccessAdapter,
  type RecordAccessItem,
} from '@/model/domain/clinical-records/RecordAccessAdapter';

export interface RecordAccessLogViewModel {
  items: RecordAccessItem[];
  isLoading: boolean;
  error: UiError | null;
}

// ViewModel
export function useRecordAccessLogViewModel(patientId: string): RecordAccessLogViewModel {
  const { data, isLoading, error } = useGetRecordAccessLogQuery(
    { patientId },
    { refetchOnMountOrArgChange: true },
  );
  const items = useMemo(() => (data ? RecordAccessAdapter.toItems(data) : []), [data]);
  return { items, isLoading, error: ApiErrorAdapter.toUiError(error) };
}
