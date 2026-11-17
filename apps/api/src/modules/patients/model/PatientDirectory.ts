import type { PatientRepository } from './PatientRepository';

export interface PatientContact {
  fullName: string;
  phone: string | null;
}

export class PatientDirectory {
  constructor(private readonly patients: PatientRepository) {}

  async exists(professionalId: string, patientId: string): Promise<boolean> {
    return (await this.patients.findOwned(professionalId, patientId)) !== null;
  }

  async fullNames(
    professionalId: string,
    patientIds: readonly string[],
  ): Promise<Map<string, string>> {
    const contacts = await this.contacts(professionalId, patientIds);
    return new Map([...contacts].map(([id, contact]) => [id, contact.fullName]));
  }

  async contacts(
    professionalId: string,
    patientIds: readonly string[],
  ): Promise<Map<string, PatientContact>> {
    const unique = [...new Set(patientIds)];
    const patients =
      unique.length > 0 ? await this.patients.findOwnedMany(professionalId, unique) : [];
    return new Map(
      patients.map((patient) => [patient.id, { fullName: patient.fullName, phone: patient.phone }]),
    );
  }
}
