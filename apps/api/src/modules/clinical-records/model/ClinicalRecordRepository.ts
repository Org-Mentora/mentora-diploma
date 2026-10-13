import { Repository } from '#core/model/Repository';
import type { ClinicalRecord } from './ClinicalRecord';

/** One record per patient, scoped to its professional (ADR-0019). */
export abstract class ClinicalRecordRepository extends Repository<ClinicalRecord> {
  abstract findByPatient(professionalId: string, patientId: string): Promise<ClinicalRecord | null>;
}
