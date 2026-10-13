import { Presenter } from '#core/presenter/Presenter';
import type { AuthenticatedActor } from '#core/security/AuthenticatedActor';
import type { View } from '#core/view/View';
import type { ClinicalRecordDto } from '../contracts/clinical-records.contracts';
import type { ClinicalRecordService } from '../model/ClinicalRecordService';
import { ClinicalRecordViewModel } from './ClinicalRecordViewModel';

export interface PatientRecordRef {
  actor: AuthenticatedActor;
  patientId: string;
}

/** CU-08 Consult clinical record. */
export class GetClinicalRecordPresenter extends Presenter<PatientRecordRef, ClinicalRecordDto> {
  constructor(
    view: View<ClinicalRecordDto>,
    private readonly records: ClinicalRecordService,
  ) {
    super(view);
  }

  protected async execute(input: PatientRecordRef): Promise<ClinicalRecordDto> {
    const record = await this.records.getRecord(input.actor.professionalId, input.patientId);
    return ClinicalRecordViewModel.record(record);
  }
}
