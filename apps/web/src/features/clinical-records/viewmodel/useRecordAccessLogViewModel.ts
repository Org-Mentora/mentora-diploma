import { useGetRecordAccessLogQuery } from '@/model/api/generated/mentoraApi';
import { type UiPagedList, usePagedList } from '@/model/api/usePagedList';
import {
  RecordAccessAdapter,
  type RecordAccessItem,
} from '@/model/domain/clinical-records/RecordAccessAdapter';

export type RecordAccessLogViewModel = UiPagedList<RecordAccessItem>;

// ViewModel
export function useRecordAccessLogViewModel(patientId: string): RecordAccessLogViewModel {
  return usePagedList(useGetRecordAccessLogQuery, { patientId }, RecordAccessAdapter.toItems);
}
