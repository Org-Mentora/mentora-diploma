/** Owned by this Model, implemented over the patients module (ADR-0022). */
export abstract class PatientLookup {
  abstract exists(professionalId: string, patientId: string): Promise<boolean>;
}
