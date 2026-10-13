import type { PatientDirectory } from '#modules/patients';
import { PatientNames } from '../model/PatientNames';

/** Adapter (ADR-0007, ADR-0022): this module's `PatientNames` over the patients module. */
export class PatientDirectoryNames extends PatientNames {
  constructor(private readonly directory: PatientDirectory) {
    super();
  }

  exists(professionalId: string, patientId: string): Promise<boolean> {
    return this.directory.exists(professionalId, patientId);
  }

  fullNames(professionalId: string, patientIds: readonly string[]): Promise<Map<string, string>> {
    return this.directory.fullNames(professionalId, patientIds);
  }
}
