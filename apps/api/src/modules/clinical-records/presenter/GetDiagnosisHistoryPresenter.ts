import { Presenter } from '#core/presenter/Presenter';
import type { View } from '#core/view/View';
import type { DiagnosisHistoryEntryDto } from '../contracts/clinical-records.contracts';
import type { ClinicalRecordService } from '../model/ClinicalRecordService';
import { ClinicalRecordViewModel } from './ClinicalRecordViewModel';
import type { PatientRecordRef } from './GetClinicalRecordPresenter';

/** CU-11 step 10: diagnosis history of the patient. */
export class GetDiagnosisHistoryPresenter extends Presenter<
  PatientRecordRef,
  DiagnosisHistoryEntryDto[]
> {
  constructor(
    view: View<DiagnosisHistoryEntryDto[]>,
    private readonly records: ClinicalRecordService,
  ) {
    super(view);
  }

  protected async execute(input: PatientRecordRef): Promise<DiagnosisHistoryEntryDto[]> {
    const history = await this.records.diagnosisHistory(
      input.actor.professionalId,
      input.patientId,
    );
    return ClinicalRecordViewModel.diagnosisHistory(history);
  }
}
