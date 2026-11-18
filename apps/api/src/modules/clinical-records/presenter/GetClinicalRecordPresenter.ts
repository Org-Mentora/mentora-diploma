import { CursorCodec, type PageInput } from '#core/presenter/CursorCodec';
import { Presenter } from '#core/presenter/Presenter';
import type { AuthenticatedActor } from '#core/security/AuthenticatedActor';
import type { View } from '#core/view/View';
import type { ClinicalRecordDto } from '../contracts/clinical-records.contracts';
import type { ClinicalRecordService } from '../model/ClinicalRecordService';
import { ClinicalRecordViewModel } from './ClinicalRecordViewModel';

export interface PatientRecordRef extends PageInput {
  actor: AuthenticatedActor;
  patientId: string;
}

// Presenter
export class GetClinicalRecordPresenter extends Presenter<PatientRecordRef, ClinicalRecordDto> {
  constructor(
    view: View<ClinicalRecordDto>,
    private readonly records: ClinicalRecordService,
  ) {
    super(view);
  }

  protected async execute(input: PatientRecordRef): Promise<ClinicalRecordDto> {
    const { record, consultations } = await this.records.getRecord(
      input.actor.professionalId,
      input.patientId,
      CursorCodec.request(input),
    );
    return ClinicalRecordViewModel.record(record, consultations);
  }
}
