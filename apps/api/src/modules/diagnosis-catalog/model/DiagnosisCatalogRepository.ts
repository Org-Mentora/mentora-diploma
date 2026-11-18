import type { Page, PageRequest } from '#core/model/Pagination';
import type { DiagnosisCatalogEntry } from './DiagnosisCatalogEntry';

export interface DiagnosisSearchCriteria {
  term: string | undefined;
  category: string | undefined;
  page: PageRequest;
}

// Repository
export abstract class DiagnosisCatalogRepository {
  abstract search(criteria: DiagnosisSearchCriteria): Promise<Page<DiagnosisCatalogEntry>>;
  abstract findByCode(code: string): Promise<DiagnosisCatalogEntry | null>;
}
