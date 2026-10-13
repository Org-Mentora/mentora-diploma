import type { QueryFilter } from 'mongoose';
import { DiagnosisCatalogEntry } from '../model/DiagnosisCatalogEntry';
import type {
  DiagnosisCatalogRepository,
  DiagnosisSearchCriteria,
} from '../model/DiagnosisCatalogRepository';
import { type DiagnosisCatalogDocument, DiagnosisCatalogModel } from './DiagnosisCatalogSchema';

function escapeRegex(term: string): string {
  return term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Adapter (ADR-0007): read-only catalog on MongoDB. */
export class MongooseDiagnosisCatalogRepository implements DiagnosisCatalogRepository {
  async search(criteria: DiagnosisSearchCriteria): Promise<DiagnosisCatalogEntry[]> {
    const filter: QueryFilter<DiagnosisCatalogDocument> = { active: true };
    if (criteria.category) {
      filter.category = criteria.category;
    }
    if (criteria.term) {
      const pattern = new RegExp(escapeRegex(criteria.term), 'i');
      filter.$or = [{ name: pattern }, { _id: pattern }];
    }
    const records = await DiagnosisCatalogModel.find(filter)
      .sort({ category: 1, _id: 1 })
      .limit(criteria.limit)
      .lean<DiagnosisCatalogDocument[]>();
    return records.map((record) => this.toDomain(record));
  }

  async findByCode(code: string): Promise<DiagnosisCatalogEntry | null> {
    const record = await DiagnosisCatalogModel.findById(code).lean<DiagnosisCatalogDocument>();
    return record ? this.toDomain(record) : null;
  }

  private toDomain(record: DiagnosisCatalogDocument): DiagnosisCatalogEntry {
    return DiagnosisCatalogEntry.restore(record._id, {
      name: record.name,
      category: record.category,
      active: record.active,
    });
  }
}
