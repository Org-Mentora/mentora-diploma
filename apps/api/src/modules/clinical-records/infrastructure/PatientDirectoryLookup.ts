import type { PatientDirectory } from '#modules/patients';
import { PatientLookup } from '../model/PatientLookup';

/** Adapter (ADR-0007, ADR-0022): this module's `PatientLookup` over the patients module. */
export class PatientDirectoryLookup extends PatientLookup {
  constructor(private readonly directory: PatientDirectory) {
    super();
  }

  exists(professionalId: string, patientId: string): Promise<boolean> {
    return this.directory.exists(professionalId, patientId);
  }
}
