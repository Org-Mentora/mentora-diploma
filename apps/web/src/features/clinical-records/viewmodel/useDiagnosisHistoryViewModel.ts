import { useGetDiagnosisHistoryQuery } from '@/model/api/generated/mentoraApi';
import { type UiPagedList, usePagedList } from '@/model/api/usePagedList';
import {
  ClinicalRecordAdapter,
  type DiagnosisHistoryItem,
} from '@/model/domain/clinical-records/ClinicalRecordAdapter';

export type DiagnosisHistoryViewModel = UiPagedList<DiagnosisHistoryItem>;

// ViewModel
export function useDiagnosisHistoryViewModel(patientId: string): DiagnosisHistoryViewModel {
  return usePagedList(
    useGetDiagnosisHistoryQuery,
    { patientId },
    ClinicalRecordAdapter.toDiagnosisHistory,
  );
}
