import type { PatientRepository } from './PatientRepository';

export class PatientActivity {
  constructor(private readonly patients: PatientRepository) {}

  async recordClinicalActivity(professionalId: string, patientId: string, at: Date): Promise<void> {
    const patient = await this.patients.findOwned(professionalId, patientId);
    if (!patient) {
      return;
    }
    const before = patient.lastClinicalActivityAt?.getTime();
    patient.recordClinicalActivity(at);
    if (patient.lastClinicalActivityAt?.getTime() !== before) {
      await this.patients.save(patient);
    }
  }
}
