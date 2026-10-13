import type { DataMapper } from '#core/model/DataMapper';
import { Professional } from '../model/Professional';
import { Subscription } from '../model/Subscription';
import type { ProfessionalDocument } from './ProfessionalSchema';

export class ProfessionalMapper implements DataMapper<Professional, ProfessionalDocument> {
  toDomain(record: ProfessionalDocument): Professional {
    return Professional.restore(record._id, {
      firstName: record.firstName,
      lastName: record.lastName,
      email: record.email,
      phone: record.phone,
      specialty: record.specialty,
      licenseNumber: record.licenseNumber,
      passwordHash: record.passwordHash,
      subscription: Subscription.restore(record.subscription.plan, record.subscription.endsAt),
      registeredAt: record.registeredAt,
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
      phone: entity.phone ?? '',
      specialty: entity.specialty,
      licenseNumber: entity.licenseNumber,
      passwordHash: entity.passwordHash,
      subscription: {
        plan: entity.subscription.plan,
        endsAt: entity.subscription.accessEndsAt,
      },
      registeredAt: entity.registeredAt,
    };
  }
}
