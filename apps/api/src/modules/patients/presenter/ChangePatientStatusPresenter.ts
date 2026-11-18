import { Presenter } from '#core/presenter/Presenter';
import type { ChangePatientStatusDto, PatientDto } from '../contracts/patients.contracts';
import type { PatientService } from '../model/PatientService';
import type { PatientRef } from './GetPatientPresenter';
import { PatientViewModel } from './PatientViewModel';

// Presenter
export class ChangePatientStatusPresenter extends Presenter<
  PatientRef & { data: ChangePatientStatusDto },
  PatientDto,
  PatientService
> {
  protected async execute(input: PatientRef & { data: ChangePatientStatusDto }) {
    const patient = await this.model.changeStatus(
      input.actor.professionalId,
      input.patientId,
      input.data.status,
    );
    return PatientViewModel.toDto(patient, this.model.now);
  }
}
