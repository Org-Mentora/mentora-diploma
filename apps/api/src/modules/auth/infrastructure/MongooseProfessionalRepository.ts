import { MongooseRepository } from '#infrastructure/database/MongooseRepository';
import type { Professional } from '../model/Professional';
import type { ProfessionalRepository } from '../model/ProfessionalRepository';
import { ProfessionalMapper } from './ProfessionalMapper';
import { type ProfessionalDocument, ProfessionalModel } from './ProfessionalSchema';

/** Adapter (ADR-0007): `ProfessionalRepository` on MongoDB. */
export class MongooseProfessionalRepository
  extends MongooseRepository<Professional, ProfessionalDocument>
  implements ProfessionalRepository
{
  constructor() {
    super(ProfessionalModel, new ProfessionalMapper());
  }

  async findByEmail(email: string): Promise<Professional | null> {
    const record = await this.model.findOne({ email }).lean<ProfessionalDocument>().exec();
    return record ? this.mapper.toDomain(record) : null;
  }

  async findByLicenseNumber(licenseNumber: string): Promise<Professional | null> {
    const record = await this.model.findOne({ licenseNumber }).lean<ProfessionalDocument>().exec();
    return record ? this.mapper.toDomain(record) : null;
  }
}
