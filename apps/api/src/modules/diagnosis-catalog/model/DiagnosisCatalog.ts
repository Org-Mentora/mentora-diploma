import type { DiagnosisCatalogEntry } from './DiagnosisCatalogEntry';
import type { DiagnosisCatalogRepository } from './DiagnosisCatalogRepository';

const MAX_RESULTS = 50;

/**
 * Model service for the DSM-5 catalog (CU-11 steps 2-5). Also exposed to other modules
 * through `index.ts` to resolve a code into a diagnosis (ADR-0022).
 */
export class DiagnosisCatalog {
  constructor(private readonly entries: DiagnosisCatalogRepository) {}

  search(term: string | undefined, category: string | undefined): Promise<DiagnosisCatalogEntry[]> {
    return this.entries.search({
      term: term?.trim() || undefined,
      category: category?.trim() || undefined,
      limit: MAX_RESULTS,
    });
  }

  /** Active entry for `code`, or `null` when it does not exist or was retired. */
  async findActive(code: string): Promise<DiagnosisCatalogEntry | null> {
    const entry = await this.entries.findByCode(code.trim().toUpperCase());
    return entry?.active ? entry : null;
  }
}
