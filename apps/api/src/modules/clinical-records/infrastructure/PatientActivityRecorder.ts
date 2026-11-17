import type { PatientActivity } from '#modules/patients';
import { ClinicalActivityRecorder } from '../model/ClinicalActivityRecorder';

// Adapter
export class PatientActivityRecorder extends ClinicalActivityRecorder {
  constructor(private readonly activity: PatientActivity) {
    super();
  }

  record(professionalId: string, patientId: string, at: Date): Promise<void> {
    return this.activity.recordClinicalActivity(professionalId, patientId, at);
  }
}
