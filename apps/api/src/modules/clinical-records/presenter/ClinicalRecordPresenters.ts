import type { View } from '#core/view/View';
import type {
  ClinicalRecordDto,
  ConsultationDto,
  DiagnosisHistoryPageDto,
  RecordAccessPageDto,
} from '../contracts/clinical-records.contracts';
import type { ClinicalRecordService } from '../model/ClinicalRecordService';
import { GetClinicalRecordPresenter } from './GetClinicalRecordPresenter';
import { GetConsultationPresenter } from './GetConsultationPresenter';
import { GetDiagnosisHistoryPresenter } from './GetDiagnosisHistoryPresenter';
import { ListRecordAccessPresenter } from './ListRecordAccessPresenter';
import { RegisterConsultationPresenter } from './RegisterConsultationPresenter';

// Abstract Factory
export class ClinicalRecordPresenters {
  constructor(private readonly clinicalRecordService: ClinicalRecordService) {}

  getClinicalRecord(view: View<ClinicalRecordDto>) {
    return new GetClinicalRecordPresenter(view, this.clinicalRecordService);
  }

  registerConsultation(view: View<ConsultationDto>) {
    return new RegisterConsultationPresenter(view, this.clinicalRecordService);
  }

  getConsultation(view: View<ConsultationDto>) {
    return new GetConsultationPresenter(view, this.clinicalRecordService);
  }

  getDiagnosisHistory(view: View<DiagnosisHistoryPageDto>) {
    return new GetDiagnosisHistoryPresenter(view, this.clinicalRecordService);
  }

  listRecordAccess(view: View<RecordAccessPageDto>) {
    return new ListRecordAccessPresenter(view, this.clinicalRecordService);
  }
}
