import type { DataMapper } from '#core/model/DataMapper';
import { FamilyContact } from '../model/FamilyContact';
import { Patient } from '../model/Patient';
import { PatientSearch } from '../model/PatientSearch';
import type { PatientDocument } from './PatientSchema';

export class PatientMapper implements DataMapper<Patient, PatientDocument> {
  toDomain(record: PatientDocument): Patient {
    return Patient.restore(record._id, {
      professionalId: record.professionalId,
      firstName: record.firstName,
      lastName: record.lastName,
      dni: record.dni,
      birthDate: record.birthDate,
      gender: record.gender,
      phone: record.phone,
      email: record.email,
      address: record.address,
      healthInsurance: record.healthInsurance,
      memberNumber: record.memberNumber,
      familyContact: record.familyContact
        ? FamilyContact.create(record.familyContact.name, record.familyContact.phone)
        : null,
      debt: record.debt,
      allergies: [...record.allergies],
      observations: record.observations,
      status: record.status,
      statusChangedAt: record.statusChangedAt,
      statusOrigin: record.statusOrigin,
      registeredAt: record.registeredAt,
      updatedAt: record.updatedAt,
    });
  }

  toPersistence(patient: Patient): PatientDocument {
    return {
      _id: patient.id,
      professionalId: patient.professionalId,
      firstName: patient.firstName,
      lastName: patient.lastName,
      dni: patient.dni,
      birthDate: patient.birthDate,
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
      statusChangedAt: patient.statusChangedAt,
      statusOrigin: patient.statusOrigin,
      registeredAt: patient.registeredAt,
      updatedAt: patient.updatedAt,
      searchText: PatientSearch.indexText(patient.firstName, patient.lastName, patient.dni),
    };
  }
}
