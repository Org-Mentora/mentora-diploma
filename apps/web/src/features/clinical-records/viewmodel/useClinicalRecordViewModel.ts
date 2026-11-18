import { useMemo, useState } from 'react';
import { ApiErrorAdapter, type UiError } from '@/model/api/ApiErrorAdapter';
import {
  type ClinicalRecordDto,
  useGetClinicalRecordQuery,
  useGetConsultationQuery,
} from '@/model/api/generated/mentoraApi';
import { usePagedQuery } from '@/model/api/usePagedQuery';
import {
  ClinicalRecordAdapter,
  type ConsultationDetail,
  type TimelineItem,
} from '@/model/domain/clinical-records/ClinicalRecordAdapter';

export interface ClinicalRecordViewModel {
  timeline: TimelineItem[];
  isLoading: boolean;
  hasMore: boolean;
  isLoadingMore: boolean;
  loadMore: () => void;
  error: UiError | null;
  newConsultationPath: string;
  selectedId: string | null;
  detail: ConsultationDetail | null;
  isLoadingDetail: boolean;
  openConsultation: (consultationId: string) => void;
  closeConsultation: () => void;
}

const consultationsOf = (record: ClinicalRecordDto) => record.consultations;

// ViewModel
export function useClinicalRecordViewModel(patientId: string): ClinicalRecordViewModel {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const record = usePagedQuery(
    useGetClinicalRecordQuery,
    { patientId },
    { select: consultationsOf },
  );
  const consultation = useGetConsultationQuery(
    { patientId, consultationId: selectedId ?? '' },
    { skip: !selectedId },
  );

  const timeline = useMemo(() => ClinicalRecordAdapter.toTimeline(record.items), [record.items]);
  const detail = useMemo(
    () =>
      selectedId && consultation.data ? ClinicalRecordAdapter.toDetail(consultation.data) : null,
    [selectedId, consultation.data],
  );

  return {
    timeline,
    isLoading: record.isLoading,
    hasMore: record.hasMore,
    isLoadingMore: record.isLoadingMore,
    loadMore: record.loadMore,
    error: ApiErrorAdapter.toUiError(record.error),
    newConsultationPath: `/patients/${patientId}/consultations/new`,
    selectedId,
    detail,
    isLoadingDetail: consultation.isFetching,
    openConsultation: setSelectedId,
    closeConsultation: () => setSelectedId(null),
  };
}
