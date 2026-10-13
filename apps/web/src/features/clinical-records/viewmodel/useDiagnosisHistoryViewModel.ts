import { useMemo } from 'react';
import { ApiErrorAdapter, type UiError } from '@/model/api/ApiErrorAdapter';
import { useGetDiagnosisHistoryQuery } from '@/model/api/generated/mentoraApi';
import {
  ClinicalRecordAdapter,
  type DiagnosisHistoryItem,
} from '@/model/domain/clinical-records/ClinicalRecordAdapter';

export interface DiagnosisHistoryViewModel {
  items: DiagnosisHistoryItem[];
  isLoading: boolean;
  error: UiError | null;
}

/** CU-11 step 10: diagnosis history of the patient. */
export function useDiagnosisHistoryViewModel(patientId: string): DiagnosisHistoryViewModel {
  const { data, isLoading, error } = useGetDiagnosisHistoryQuery({ patientId });
  const items = useMemo(() => (data ? ClinicalRecordAdapter.toDiagnosisHistory(data) : []), [data]);
  return { items, isLoading, error: ApiErrorAdapter.toUiError(error) };
}
