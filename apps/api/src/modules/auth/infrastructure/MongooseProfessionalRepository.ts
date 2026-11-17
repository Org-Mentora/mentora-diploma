import { MongooseRepository } from '#infrastructure/database/MongooseRepository';
import type { TransactionContext } from '#infrastructure/database/TransactionContext';
import type { Professional } from '../model/Professional';
import type { ProfessionalRepository } from '../model/ProfessionalRepository';
import { ProfessionalMapper } from './ProfessionalMapper';
import { type ProfessionalDocument, ProfessionalModel } from './ProfessionalSchema';

// Repository, Adapter
export class MongooseProfessionalRepository
  extends MongooseRepository<Professional, ProfessionalDocument>
  implements ProfessionalRepository
{
  constructor(context: TransactionContext) {
    super(ProfessionalModel, new ProfessionalMapper(), context);
  }

  async findByEmail(email: string): Promise<Professional | null> {
    const record = await this.model
      .findOne({ email })
      .session(this.session)
      .lean<ProfessionalDocument>()
      .exec();
    return record ? this.mapper.toDomain(record) : null;
  }

  async findByLicenseNumber(licenseNumber: string): Promise<Professional | null> {
    const record = await this.model
      .findOne({ licenseNumber })
      .session(this.session)
      .lean<ProfessionalDocument>()
      .exec();
    return record ? this.mapper.toDomain(record) : null;
  }
}
