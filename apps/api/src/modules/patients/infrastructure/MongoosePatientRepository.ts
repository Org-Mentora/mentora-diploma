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
    return this.findOneBy({ _id: id, professionalId });
  }

  async findOwnedMany(professionalId: string, ids: readonly string[]): Promise<Patient[]> {
    return this.findManyBy({ _id: { $in: [...ids] }, professionalId });
  }

  async findByDni(professionalId: string, dni: string): Promise<Patient | null> {
    return this.findOneBy({ professionalId, dni });
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
    return this.findPage(BY_SURNAME, filter, page);
  }

  async findDormant(cutoff: Date, limit: number): Promise<Patient[]> {
    return this.findManyBy(
      {
        status: 'active',
        statusChangedAt: { $lt: cutoff },
        registeredAt: { $lt: cutoff },
        $or: [{ lastClinicalActivityAt: null }, { lastClinicalActivityAt: { $lt: cutoff } }],
      },
      { limit },
    );
  }
}
