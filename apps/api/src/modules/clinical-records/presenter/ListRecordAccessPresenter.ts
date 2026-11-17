import { Presenter } from '#core/presenter/Presenter';
import type { View } from '#core/view/View';
import type { RecordAccessDto } from '../contracts/clinical-records.contracts';
import type { ClinicalRecordService } from '../model/ClinicalRecordService';
import type { PatientRecordRef } from './GetClinicalRecordPresenter';

// Presenter
export class ListRecordAccessPresenter extends Presenter<PatientRecordRef, RecordAccessDto[]> {
  constructor(
    view: View<RecordAccessDto[]>,
    private readonly records: ClinicalRecordService,
  ) {
    super(view);
  }

  protected async execute(input: PatientRecordRef): Promise<RecordAccessDto[]> {
    const accesses = await this.records.accessLog(input.actor.professionalId, input.patientId);
    return accesses.map((access) => ({
      action: access.action,
      consultationId: access.consultationId,
      at: access.at.toISOString(),
    }));
  }
}
