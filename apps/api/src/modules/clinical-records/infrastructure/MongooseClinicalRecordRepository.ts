import { MongooseRepository } from '#infrastructure/database/MongooseRepository';
import type { ClinicalRecord } from '../model/ClinicalRecord';
import type { ClinicalRecordRepository } from '../model/ClinicalRecordRepository';
import { ClinicalRecordMapper } from './ClinicalRecordMapper';
import { type ClinicalRecordDocument, ClinicalRecordModel } from './ClinicalRecordSchema';

/** Adapter (ADR-0007): the clinical record aggregate stored as one document (ADR-0020). */
export class MongooseClinicalRecordRepository
  extends MongooseRepository<ClinicalRecord, ClinicalRecordDocument>
  implements ClinicalRecordRepository
{
  constructor() {
    super(ClinicalRecordModel, new ClinicalRecordMapper());
  }

  async findByPatient(professionalId: string, patientId: string): Promise<ClinicalRecord | null> {
    const record = await this.model
      .findOne({ professionalId, patientId })
      .lean<ClinicalRecordDocument>();
    return record ? this.mapper.toDomain(record) : null;
  }
}
