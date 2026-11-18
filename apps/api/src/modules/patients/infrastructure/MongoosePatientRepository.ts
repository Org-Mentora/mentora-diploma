import type { Page, PageRequest } from '#core/model/Pagination';
import { Keyset } from '#infrastructure/database/Keyset';
import { MongooseRepository } from '#infrastructure/database/MongooseRepository';
import type { TransactionContext } from '#infrastructure/database/TransactionContext';
import type { Patient } from '../model/Patient';
import type { PatientRepository } from '../model/PatientRepository';
import { PatientMapper } from './PatientMapper';
import { type PatientDocument, PatientModel } from './PatientSchema';

const BY_SURNAME = new Keyset([
  { path: 'lastName', direction: 1 },
  { path: 'firstName', direction: 1 },
  { path: '_id', direction: 1 },
]);

function escapeRegex(term: string): string {
  return term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Repository, Adapter
export class MongoosePatientRepository
  extends MongooseRepository<Patient, PatientDocument>
  implements PatientRepository
{
  constructor(context: TransactionContext) {
    super(PatientModel, new PatientMapper(), context);
  }

  async findOwned(professionalId: string, id: string): Promise<Patient | null> {
    const record = await this.model
      .findOne({ _id: id, professionalId })
      .session(this.session)
      .lean<PatientDocument>();
    return record ? this.mapper.toDomain(record) : null;
  }

  async findOwnedMany(professionalId: string, ids: readonly string[]): Promise<Patient[]> {
    const records = await this.model
      .find({ _id: { $in: [...ids] }, professionalId })
      .session(this.session)
      .lean<PatientDocument[]>();
    return records.map((record) => this.mapper.toDomain(record));
  }

  async findByDni(professionalId: string, dni: string): Promise<Patient | null> {
    const record = await this.model
      .findOne({ professionalId, dni })
      .session(this.session)
      .lean<PatientDocument>();
    return record ? this.mapper.toDomain(record) : null;
  }

  async search(
    professionalId: string,
    terms: readonly string[],
    page: PageRequest,
  ): Promise<Page<Patient>> {
    const filter =
      terms.length > 0
        ? {
            professionalId,
            $and: terms.map((term) => ({ searchText: { $regex: escapeRegex(term) } })),
          }
        : { professionalId };
    const records = await this.model
      .find(BY_SURNAME.where(filter, page.after))
      .sort(BY_SURNAME.sort())
      .limit(page.limit + 1)
      .session(this.session)
      .lean<PatientDocument[]>();
    return BY_SURNAME.page(records, page, (record) => this.mapper.toDomain(record));
  }

  async findDormant(cutoff: Date, limit: number): Promise<Patient[]> {
    const records = await this.model
      .find({
        status: 'active',
        statusChangedAt: { $lt: cutoff },
        registeredAt: { $lt: cutoff },
        $or: [{ lastClinicalActivityAt: null }, { lastClinicalActivityAt: { $lt: cutoff } }],
      })
      .limit(limit)
      .session(this.session)
      .lean<PatientDocument[]>();
    return records.map((record) => this.mapper.toDomain(record));
  }
}
