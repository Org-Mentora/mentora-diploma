import type { DiagnosisCatalogEntry } from './DiagnosisCatalogEntry';

export interface DiagnosisSearchCriteria {
  term: string | undefined;
  category: string | undefined;
  limit: number;
}

// Repository
export abstract class DiagnosisCatalogRepository {
  abstract search(criteria: DiagnosisSearchCriteria): Promise<DiagnosisCatalogEntry[]>;
  abstract findByCode(code: string): Promise<DiagnosisCatalogEntry | null>;
}
