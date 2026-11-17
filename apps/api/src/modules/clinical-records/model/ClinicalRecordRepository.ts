import { Repository } from '#core/model/Repository';
import type { ClinicalRecord } from './ClinicalRecord';

// Repository
export abstract class ClinicalRecordRepository extends Repository<ClinicalRecord> {
  abstract findByPatient(professionalId: string, patientId: string): Promise<ClinicalRecord | null>;
}
