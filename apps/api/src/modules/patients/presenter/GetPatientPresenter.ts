import { Presenter } from '#core/presenter/Presenter';
import type { AuthenticatedActor } from '#core/security/AuthenticatedActor';
import type { PatientDto } from '../contracts/patients.contracts';
import type { PatientService } from '../model/PatientService';
import { PatientViewModel } from './PatientViewModel';

export interface PatientRef {
  actor: AuthenticatedActor;
  patientId: string;
}

// Presenter
export class GetPatientPresenter extends Presenter<PatientRef, PatientDto, PatientService> {
  protected async execute(input: PatientRef) {
    const patient = await this.model.get(input.actor.professionalId, input.patientId);
    return PatientViewModel.toDto(patient, this.model.now);
  }
}
