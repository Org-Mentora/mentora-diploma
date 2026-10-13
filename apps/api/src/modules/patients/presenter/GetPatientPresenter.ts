import { Presenter } from '#core/presenter/Presenter';
import type { AuthenticatedActor } from '#core/security/AuthenticatedActor';
import type { View } from '#core/view/View';
import type { PatientDto } from '../contracts/patients.contracts';
import type { PatientService } from '../model/PatientService';
import { PatientViewModel } from './PatientViewModel';

export interface PatientRef {
  actor: AuthenticatedActor;
  patientId: string;
}

/** Patient profile (end of CU-05). */
export class GetPatientPresenter extends Presenter<PatientRef, PatientDto> {
  constructor(
    view: View<PatientDto>,
    private readonly patients: PatientService,
  ) {
    super(view);
  }

  protected async execute(input: PatientRef) {
    const patient = await this.patients.get(input.actor.professionalId, input.patientId);
    return PatientViewModel.toDto(patient, this.patients.now);
  }
}
