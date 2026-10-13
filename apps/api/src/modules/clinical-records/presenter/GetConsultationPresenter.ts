import { Presenter } from '#core/presenter/Presenter';
import type { View } from '#core/view/View';
import type { ConsultationDto } from '../contracts/clinical-records.contracts';
import type { ClinicalRecordService } from '../model/ClinicalRecordService';
import { ClinicalRecordViewModel } from './ClinicalRecordViewModel';
import type { PatientRecordRef } from './GetClinicalRecordPresenter';

/** CU-08 step 6: full detail of one consultation. */
export class GetConsultationPresenter extends Presenter<
  PatientRecordRef & { consultationId: string },
  ConsultationDto
> {
  constructor(
    view: View<ConsultationDto>,
    private readonly records: ClinicalRecordService,
  ) {
    super(view);
  }

  protected async execute(
    input: PatientRecordRef & { consultationId: string },
  ): Promise<ConsultationDto> {
    const consultation = await this.records.getConsultation(
      input.actor.professionalId,
      input.patientId,
      input.consultationId,
    );
    return ClinicalRecordViewModel.consultation(consultation);
  }
}
