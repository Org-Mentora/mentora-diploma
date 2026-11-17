import type { PatientService } from './PatientService';

export interface IntakeDetails {
  firstName: string;
  lastName: string;
  dni: string;
  birthDate: Date | null;
  phone: string | null;
  email: string | null;
}

export class PatientIntake {
  constructor(private readonly patients: PatientService) {}

  async findIdByDni(professionalId: string, dni: string): Promise<string | null> {
    return (await this.patients.findByDni(professionalId, dni))?.id ?? null;
  }

  async register(professionalId: string, details: IntakeDetails): Promise<string> {
    const patient = await this.patients.register(professionalId, {
      ...details,
      gender: null,
      address: null,
      healthInsurance: null,
      memberNumber: null,
      familyContact: null,
      debt: 0,
      allergies: [],
      observations: null,
    });
    return patient.id;
  }
}
