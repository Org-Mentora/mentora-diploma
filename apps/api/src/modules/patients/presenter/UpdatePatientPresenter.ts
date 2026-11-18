import { Presenter } from '#core/presenter/Presenter';
import type { PatientDto, PatientInputDto } from '../contracts/patients.contracts';
import type { PatientService } from '../model/PatientService';
import type { PatientRef } from './GetPatientPresenter';
import { PatientViewModel } from './PatientViewModel';

// Presenter
export class UpdatePatientPresenter extends Presenter<
  PatientRef & { data: PatientInputDto },
  PatientDto,
  PatientService
> {
  protected async execute(input: PatientRef & { data: PatientInputDto }) {
    const patient = await this.model.update(
      input.actor.professionalId,
      input.patientId,
      PatientViewModel.toDetails(input.data),
    );
    return PatientViewModel.toDto(patient, this.model.now);
  }
}
