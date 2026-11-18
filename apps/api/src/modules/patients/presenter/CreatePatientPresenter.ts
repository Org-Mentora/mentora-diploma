import { Presenter } from '#core/presenter/Presenter';
import type { AuthenticatedActor } from '#core/security/AuthenticatedActor';
import type { PatientDto, PatientInputDto } from '../contracts/patients.contracts';
import type { PatientService } from '../model/PatientService';
import { PatientViewModel } from './PatientViewModel';

// Presenter
export class CreatePatientPresenter extends Presenter<
  { actor: AuthenticatedActor; data: PatientInputDto },
  PatientDto,
  PatientService
> {
  protected async execute(input: { actor: AuthenticatedActor; data: PatientInputDto }) {
    const details = PatientViewModel.toDetails(input.data);
    const patient = await this.model.register(input.actor.professionalId, details);
    return PatientViewModel.toDto(patient, this.model.now);
  }
}
