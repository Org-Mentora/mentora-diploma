import { Repository } from '#core/model/Repository';
import type { Patient } from './Patient';

// Repository
export abstract class PatientRepository extends Repository<Patient> {
  abstract findOwned(professionalId: string, id: string): Promise<Patient | null>;
  abstract findOwnedMany(professionalId: string, ids: readonly string[]): Promise<Patient[]>;
  abstract findByDni(professionalId: string, dni: string): Promise<Patient | null>;
  abstract search(professionalId: string, terms: readonly string[]): Promise<Patient[]>;
  abstract findDormant(cutoff: Date, limit: number): Promise<Patient[]>;
}
