import { Presenter } from '#core/presenter/Presenter';
import type { View } from '#core/view/View';
import type {
  ConsultationDto,
  RegisterConsultationRequestDto,
} from '../contracts/clinical-records.contracts';
import type { ClinicalRecordService } from '../model/ClinicalRecordService';
import { ClinicalRecordViewModel } from './ClinicalRecordViewModel';
import type { PatientRecordRef } from './GetClinicalRecordPresenter';

/** CU-09 Register consultation, including CU-11 (diagnosis) and CU-12 (medication). */
export class RegisterConsultationPresenter extends Presenter<
  PatientRecordRef & { data: RegisterConsultationRequestDto },
  ConsultationDto
> {
  constructor(
    view: View<ConsultationDto>,
    private readonly records: ClinicalRecordService,
  ) {
    super(view);
  }

  protected async execute(
    input: PatientRecordRef & { data: RegisterConsultationRequestDto },
  ): Promise<ConsultationDto> {
    const { data } = input;
    const consultation = await this.records.registerConsultation(
      input.actor.professionalId,
      input.patientId,
      {
        date: new Date(data.date),
        type: data.type,
        reason: data.reason,
        observations: data.observations ?? null,
        evolution: data.evolution ?? null,
        diagnosisCode: data.diagnosisCode || null,
        medications: (data.medications ?? []).map((m) => ({
          ...m,
          indications: m.indications ?? null,
        })),
      },
    );
    return ClinicalRecordViewModel.consultation(consultation);
  }
}
