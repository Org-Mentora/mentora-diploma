import type { PatientRepository } from './PatientRepository';

/**
 * Read-only query service exposed to other modules through `index.ts` (ADR-0022).
 * It never returns the `Patient` aggregate, only what collaborators need.
 */
export class PatientDirectory {
  constructor(private readonly patients: PatientRepository) {}

  async exists(professionalId: string, patientId: string): Promise<boolean> {
    return (await this.patients.findOwned(professionalId, patientId)) !== null;
  }

  async fullNames(
    professionalId: string,
    patientIds: readonly string[],
  ): Promise<Map<string, string>> {
    const unique = [...new Set(patientIds)];
    const patients =
      unique.length > 0 ? await this.patients.findOwnedMany(professionalId, unique) : [];
    return new Map(patients.map((patient) => [patient.id, patient.fullName]));
  }
}
