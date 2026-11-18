import type { QueryFilter } from 'mongoose';
import type { Page } from '#core/model/Pagination';
import { Keyset } from '#infrastructure/database/Keyset';
import { DiagnosisCatalogEntry } from '../model/DiagnosisCatalogEntry';
import type {
  DiagnosisCatalogRepository,
  DiagnosisSearchCriteria,
} from '../model/DiagnosisCatalogRepository';
import { type DiagnosisCatalogDocument, DiagnosisCatalogModel } from './DiagnosisCatalogSchema';

function escapeRegex(term: string): string {
  return term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const BY_CATEGORY = new Keyset([
  { path: 'category', direction: 1 },
  { path: '_id', direction: 1 },
]);

// Repository, Adapter
export class MongooseDiagnosisCatalogRepository implements DiagnosisCatalogRepository {
  async search(criteria: DiagnosisSearchCriteria): Promise<Page<DiagnosisCatalogEntry>> {
    const filter: QueryFilter<DiagnosisCatalogDocument> = { active: true };
    if (criteria.category) {
      filter.category = criteria.category;
    }
    if (criteria.term) {
      const pattern = new RegExp(escapeRegex(criteria.term), 'i');
      filter.$or = [{ name: pattern }, { _id: pattern }];
    }
    const { page } = criteria;
    const records = await DiagnosisCatalogModel.find(BY_CATEGORY.where(filter, page.after))
      .sort(BY_CATEGORY.sort())
      .limit(page.limit + 1)
      .lean<DiagnosisCatalogDocument[]>();
    return BY_CATEGORY.page(records, page, (record) => this.toDomain(record));
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
