import { Presenter } from '#core/presenter/Presenter';
import type { View } from '#core/view/View';
import type { ChangePatientStatusDto, PatientDto } from '../contracts/patients.contracts';
import type { PatientService } from '../model/PatientService';
import type { PatientRef } from './GetPatientPresenter';
import { PatientViewModel } from './PatientViewModel';

/** CU-07 Change patient status (manual flow). */
export class ChangePatientStatusPresenter extends Presenter<
  PatientRef & { data: ChangePatientStatusDto },
  PatientDto
> {
  constructor(
    view: View<PatientDto>,
    private readonly patients: PatientService,
  ) {
    super(view);
  }

  protected async execute(input: PatientRef & { data: ChangePatientStatusDto }) {
    const patient = await this.patients.changeStatus(
      input.actor.professionalId,
      input.patientId,
      input.data.status,
    );
    return PatientViewModel.toDto(patient, this.patients.now);
  }
}
