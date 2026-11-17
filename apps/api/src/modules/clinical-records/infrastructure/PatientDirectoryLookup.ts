import type { PatientDirectory } from '#modules/patients';
import { PatientLookup } from '../model/PatientLookup';

// Adapter
export class PatientDirectoryLookup extends PatientLookup {
  constructor(private readonly directory: PatientDirectory) {
    super();
  }

  exists(professionalId: string, patientId: string): Promise<boolean> {
    return this.directory.exists(professionalId, patientId);
  }
}
