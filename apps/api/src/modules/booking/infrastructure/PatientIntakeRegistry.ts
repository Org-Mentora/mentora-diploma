import type { PatientIntake } from '#modules/patients';
import type { Requester } from '../model/BookingRequest';
import { PatientRegistry } from '../model/PatientRegistry';

// Adapter
export class PatientIntakeRegistry extends PatientRegistry {
  constructor(private readonly intake: PatientIntake) {
    super();
  }

  findIdByDni(professionalId: string, dni: string): Promise<string | null> {
    return this.intake.findIdByDni(professionalId, dni);
  }

  register(professionalId: string, requester: Requester): Promise<string> {
    return this.intake.register(professionalId, requester);
  }
}
