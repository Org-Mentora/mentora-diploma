import { Presenter } from '#core/presenter/Presenter';
import type { AuthenticatedActor } from '#core/security/AuthenticatedActor';
import type { View } from '#core/view/View';
import type { PatientDto, PatientInputDto } from '../contracts/patients.contracts';
import type { PatientService } from '../model/PatientService';
import { PatientViewModel } from './PatientViewModel';

/** CU-04 Register patient. */
export class CreatePatientPresenter extends Presenter<
  { actor: AuthenticatedActor; data: PatientInputDto },
  PatientDto
> {
  constructor(
    view: View<PatientDto>,
    private readonly patients: PatientService,
  ) {
    super(view);
  }

  protected async execute(input: { actor: AuthenticatedActor; data: PatientInputDto }) {
    const details = PatientViewModel.toDetails(input.data);
    const patient = await this.patients.register(input.actor.professionalId, details);
    return PatientViewModel.toDto(patient, this.patients.now);
  }
}
