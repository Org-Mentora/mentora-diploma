import type { DiagnosisCatalogEntry } from './DiagnosisCatalogEntry';

export interface DiagnosisSearchCriteria {
  term: string | undefined;
  category: string | undefined;
  limit: number;
}

/** Read-only access to the catalog: professionals can never write to it. */
export abstract class DiagnosisCatalogRepository {
  abstract search(criteria: DiagnosisSearchCriteria): Promise<DiagnosisCatalogEntry[]>;
  abstract findByCode(code: string): Promise<DiagnosisCatalogEntry | null>;
}
