import { Presenter } from '#core/presenter/Presenter';
import type { View } from '#core/view/View';
import type { PatientDto, PatientInputDto } from '../contracts/patients.contracts';
import type { PatientService } from '../model/PatientService';
import type { PatientRef } from './GetPatientPresenter';
import { PatientViewModel } from './PatientViewModel';

/** CU-06 Update patient. */
export class UpdatePatientPresenter extends Presenter<
  PatientRef & { data: PatientInputDto },
  PatientDto
> {
  constructor(
    view: View<PatientDto>,
    private readonly patients: PatientService,
  ) {
    super(view);
  }

  protected async execute(input: PatientRef & { data: PatientInputDto }) {
    const patient = await this.patients.update(
      input.actor.professionalId,
      input.patientId,
      PatientViewModel.toDetails(input.data),
    );
    return PatientViewModel.toDto(patient, this.patients.now);
  }
}
