import type {
  PatientDto,
  PatientInputDto,
  PatientSummaryDto,
} from '../contracts/patients.contracts';
import { FamilyContact } from '../model/FamilyContact';
import type { Patient, PatientDetails } from '../model/Patient';

/** Translations between the patient contracts and the Model, shared by the presenters. */
export class PatientViewModel {
  static toDto(patient: Patient, now: Date): PatientDto {
    return {
      id: patient.id,
      firstName: patient.firstName,
      lastName: patient.lastName,
      fullName: patient.fullName,
      dni: patient.dni,
      birthDate: patient.birthDate?.toISOString().slice(0, 10) ?? null,
      age: patient.age(now),
      gender: patient.gender,
      phone: patient.phone,
      email: patient.email,
      address: patient.address,
      healthInsurance: patient.healthInsurance,
      memberNumber: patient.memberNumber,
      familyContact: patient.familyContact
        ? { name: patient.familyContact.name, phone: patient.familyContact.phone }
        : null,
      debt: patient.debt,
      allergies: [...patient.allergies],
      observations: patient.observations,
      status: patient.status,
      statusChangedAt: patient.statusChangedAt.toISOString(),
      statusOrigin: patient.statusOrigin,
      registeredAt: patient.registeredAt.toISOString(),
    };
  }

  static toSummary(patient: Patient, now: Date): PatientSummaryDto {
    return {
      id: patient.id,
      fullName: patient.fullName,
      dni: patient.dni,
      age: patient.age(now),
      phone: patient.phone,
      healthInsurance: patient.healthInsurance,
      status: patient.status,
    };
  }

  static toDetails(input: PatientInputDto): PatientDetails {
    const text = (value: string | null | undefined) => (value?.trim() ? value.trim() : null);
    return {
      firstName: input.firstName,
      lastName: input.lastName,
      dni: input.dni,
      birthDate: input.birthDate ? new Date(`${input.birthDate}T00:00:00.000Z`) : null,
      gender: text(input.gender),
      phone: text(input.phone),
      email: text(input.email),
      address: text(input.address),
      healthInsurance: text(input.healthInsurance),
      memberNumber: text(input.memberNumber),
      familyContact: input.familyContact
        ? FamilyContact.create(input.familyContact.name, input.familyContact.phone)
        : null,
      debt: input.debt ?? 0,
      allergies: input.allergies ?? [],
      observations: text(input.observations),
    };
  }
}
