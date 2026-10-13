/** Owned by this Model, implemented over the patients module (ADR-0022). */
export abstract class PatientNames {
  abstract exists(professionalId: string, patientId: string): Promise<boolean>;
  abstract fullNames(
    professionalId: string,
    patientIds: readonly string[],
  ): Promise<Map<string, string>>;
}
