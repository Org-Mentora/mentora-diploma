import { MongooseRepository } from '#infrastructure/database/MongooseRepository';
import type { Patient } from '../model/Patient';
import type { PatientRepository } from '../model/PatientRepository';
import { PatientMapper } from './PatientMapper';
import { type PatientDocument, PatientModel } from './PatientSchema';

const SEARCH_LIMIT = 200;

function escapeRegex(term: string): string {
  return term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Adapter (ADR-0007): `PatientRepository` on MongoDB. */
export class MongoosePatientRepository
  extends MongooseRepository<Patient, PatientDocument>
  implements PatientRepository
{
  constructor() {
    super(PatientModel, new PatientMapper());
  }

  async findOwned(professionalId: string, id: string): Promise<Patient | null> {
    const record = await this.model.findOne({ _id: id, professionalId }).lean<PatientDocument>();
    return record ? this.mapper.toDomain(record) : null;
  }

  async findOwnedMany(professionalId: string, ids: readonly string[]): Promise<Patient[]> {
    const records = await this.model
      .find({ _id: { $in: [...ids] }, professionalId })
      .lean<PatientDocument[]>();
    return records.map((record) => this.mapper.toDomain(record));
  }

  async findByDni(professionalId: string, dni: string): Promise<Patient | null> {
    const record = await this.model.findOne({ professionalId, dni }).lean<PatientDocument>();
    return record ? this.mapper.toDomain(record) : null;
  }

  async search(professionalId: string, terms: readonly string[]): Promise<Patient[]> {
    const filter =
      terms.length > 0
        ? {
            professionalId,
            $and: terms.map((term) => ({ searchText: { $regex: escapeRegex(term) } })),
          }
        : { professionalId };
    const records = await this.model
      .find(filter)
      .sort({ lastName: 1, firstName: 1 })
      .limit(SEARCH_LIMIT)
      .lean<PatientDocument[]>();
    return records.map((record) => this.mapper.toDomain(record));
  }
}
