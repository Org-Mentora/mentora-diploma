import { CursorCodec } from '#core/presenter/CursorCodec';
import { Presenter } from '#core/presenter/Presenter';
import type { DiagnosisHistoryPageDto } from '../contracts/clinical-records.contracts';
import type { ClinicalRecordService } from '../model/ClinicalRecordService';
import { ClinicalRecordViewModel } from './ClinicalRecordViewModel';
import type { PatientRecordRef } from './GetClinicalRecordPresenter';

// Presenter
export class GetDiagnosisHistoryPresenter extends Presenter<
  PatientRecordRef,
  DiagnosisHistoryPageDto,
  ClinicalRecordService
> {
  protected async execute(input: PatientRecordRef): Promise<DiagnosisHistoryPageDto> {
    const page = await this.model.diagnosisHistory(
      input.actor.professionalId,
      input.patientId,
      CursorCodec.request(input),
    );
    return CursorCodec.toDto(page, ClinicalRecordViewModel.diagnosisEntry);
  }
}
