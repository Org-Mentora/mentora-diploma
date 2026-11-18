import { MongooseRepository } from '#infrastructure/database/MongooseRepository';
import type { TransactionContext } from '#infrastructure/database/TransactionContext';
import type { ClinicalRecord } from '../model/ClinicalRecord';
import type { ClinicalRecordRepository } from '../model/ClinicalRecordRepository';
import { ClinicalRecordMapper } from './ClinicalRecordMapper';
import { type ClinicalRecordDocument, ClinicalRecordModel } from './ClinicalRecordSchema';

// Repository, Adapter
export class MongooseClinicalRecordRepository
  extends MongooseRepository<ClinicalRecord, ClinicalRecordDocument>
  implements ClinicalRecordRepository
{
  constructor(context: TransactionContext) {
    super(ClinicalRecordModel, new ClinicalRecordMapper(), context);
  }

  async findByPatient(professionalId: string, patientId: string): Promise<ClinicalRecord | null> {
    return this.findOneBy({ professionalId, patientId });
  }
}
