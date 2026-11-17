export abstract class PatientLookup {
  abstract exists(professionalId: string, patientId: string): Promise<boolean>;
}
