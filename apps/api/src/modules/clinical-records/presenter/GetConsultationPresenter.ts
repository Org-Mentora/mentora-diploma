import { Presenter } from '#core/presenter/Presenter';
import type { ConsultationDto } from '../contracts/clinical-records.contracts';
import type { ClinicalRecordService } from '../model/ClinicalRecordService';
import { ClinicalRecordViewModel } from './ClinicalRecordViewModel';
import type { PatientRecordRef } from './GetClinicalRecordPresenter';

// Presenter
export class GetConsultationPresenter extends Presenter<
  PatientRecordRef & { consultationId: string },
  ConsultationDto,
  ClinicalRecordService
> {
  protected async execute(
    input: PatientRecordRef & { consultationId: string },
  ): Promise<ConsultationDto> {
    const consultation = await this.model.getConsultation(
      input.actor.professionalId,
      input.patientId,
      input.consultationId,
    );
    return ClinicalRecordViewModel.consultation(consultation);
  }
}
