import type { DataMapper } from '#core/model/DataMapper';
import { Professional } from '../model/Professional';
import type { ProfessionalDocument } from './ProfessionalSchema';

// Data Mapper
export class ProfessionalMapper implements DataMapper<Professional, ProfessionalDocument> {
  toDomain(record: ProfessionalDocument): Professional {
    return Professional.restore(record._id, {
      firstName: record.firstName,
      lastName: record.lastName,
      email: record.email,
      phone: record.phone,
      specialty: record.specialty,
      licenseNumber: record.licenseNumber,
      offices: [...(record.offices ?? [])],
      passwordHash: record.passwordHash,
      passwordChangedAt: record.passwordChangedAt ?? null,
      logoUpdatedAt: record.logoUpdatedAt ?? null,
      registeredAt: record.registeredAt,
      updatedAt: record.updatedAt ?? record.registeredAt,
      dni: null,
      birthDate: null,
      gender: null,
      address: null,
    });
  }

  toPersistence(entity: Professional): ProfessionalDocument {
    return {
      _id: entity.id,
      firstName: entity.firstName,
      lastName: entity.lastName,
      email: entity.email,
      phone: entity.phone,
      specialty: entity.specialty,
      licenseNumber: entity.licenseNumber,
      offices: [...entity.offices],
      passwordHash: entity.passwordHash,
      passwordChangedAt: entity.passwordChangedAt,
      logoUpdatedAt: entity.logoUpdatedAt,
      registeredAt: entity.registeredAt,
      updatedAt: entity.updatedAt,
    };
  }
}
