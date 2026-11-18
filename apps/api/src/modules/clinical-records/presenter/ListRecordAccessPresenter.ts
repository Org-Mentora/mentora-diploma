import { CursorCodec } from '#core/presenter/CursorCodec';
import { Presenter } from '#core/presenter/Presenter';
import type { RecordAccessPageDto } from '../contracts/clinical-records.contracts';
import type { ClinicalRecordService } from '../model/ClinicalRecordService';
import type { PatientRecordRef } from './GetClinicalRecordPresenter';

// Presenter
export class ListRecordAccessPresenter extends Presenter<
  PatientRecordRef,
  RecordAccessPageDto,
  ClinicalRecordService
> {
  protected async execute(input: PatientRecordRef): Promise<RecordAccessPageDto> {
    const page = await this.model.accessLog(
      input.actor.professionalId,
      input.patientId,
      CursorCodec.request(input),
    );
    return CursorCodec.toDto(page, (access) => ({
      action: access.action,
      consultationId: access.consultationId,
      at: access.at.toISOString(),
    }));
  }
}
