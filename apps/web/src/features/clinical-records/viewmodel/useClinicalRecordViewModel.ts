import { useMemo, useState } from 'react';
import { ApiErrorAdapter, type UiError } from '@/model/api/ApiErrorAdapter';
import {
  useGetClinicalRecordQuery,
  useGetConsultationQuery,
} from '@/model/api/generated/mentoraApi';
import {
  ClinicalRecordAdapter,
  type ConsultationDetail,
  type TimelineItem,
} from '@/model/domain/clinical-records/ClinicalRecordAdapter';

export interface ClinicalRecordViewModel {
  timeline: TimelineItem[];
  isLoading: boolean;
  error: UiError | null;
  newConsultationPath: string;
  selectedId: string | null;
  detail: ConsultationDetail | null;
  isLoadingDetail: boolean;
  openConsultation: (consultationId: string) => void;
  closeConsultation: () => void;
}

/** CU-08 Consult clinical record: chronological list + detail of one consultation. */
export function useClinicalRecordViewModel(patientId: string): ClinicalRecordViewModel {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const record = useGetClinicalRecordQuery({ patientId });
  const consultation = useGetConsultationQuery(
    { patientId, consultationId: selectedId ?? '' },
    { skip: !selectedId },
  );

  const timeline = useMemo(
    () => (record.data ? ClinicalRecordAdapter.toTimeline(record.data) : []),
    [record.data],
  );
  const detail = useMemo(
    () =>
      selectedId && consultation.data ? ClinicalRecordAdapter.toDetail(consultation.data) : null,
    [selectedId, consultation.data],
  );

  return {
    timeline,
    isLoading: record.isLoading,
    error: ApiErrorAdapter.toUiError(record.error),
    newConsultationPath: `/patients/${patientId}/consultations/new`,
    selectedId,
    detail,
    isLoadingDetail: consultation.isFetching,
    openConsultation: setSelectedId,
    closeConsultation: () => setSelectedId(null),
  };
}
