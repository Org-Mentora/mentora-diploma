import type { View } from '#core/view/View';
import type {
  ClinicalRecordDto,
  ConsultationDto,
  DiagnosisHistoryEntryDto,
} from '../contracts/clinical-records.contracts';
import type { GetClinicalRecordPresenter } from './GetClinicalRecordPresenter';
import type { GetConsultationPresenter } from './GetConsultationPresenter';
import type { GetDiagnosisHistoryPresenter } from './GetDiagnosisHistoryPresenter';
import type { RegisterConsultationPresenter } from './RegisterConsultationPresenter';

export interface ClinicalRecordPresenterFactory {
  getClinicalRecord(view: View<ClinicalRecordDto>): GetClinicalRecordPresenter;
  registerConsultation(view: View<ConsultationDto>): RegisterConsultationPresenter;
  getConsultation(view: View<ConsultationDto>): GetConsultationPresenter;
  getDiagnosisHistory(view: View<DiagnosisHistoryEntryDto[]>): GetDiagnosisHistoryPresenter;
}
