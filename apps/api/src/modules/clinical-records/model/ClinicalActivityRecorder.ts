export abstract class ClinicalActivityRecorder {
  abstract record(professionalId: string, patientId: string, at: Date): Promise<void>;
}
