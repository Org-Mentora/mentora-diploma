import { Repository } from '#core/model/Repository';
import type { Patient } from './Patient';

/** Every query is scoped to one professional (ADR-0019). */
export abstract class PatientRepository extends Repository<Patient> {
  abstract findOwned(professionalId: string, id: string): Promise<Patient | null>;
  abstract findOwnedMany(professionalId: string, ids: readonly string[]): Promise<Patient[]>;
  abstract findByDni(professionalId: string, dni: string): Promise<Patient | null>;
  /** Patients whose name, surname or DNI contain every normalized term; all when empty. */
  abstract search(professionalId: string, terms: readonly string[]): Promise<Patient[]>;
}
