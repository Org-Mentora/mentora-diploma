import type { DiagnosisCatalogEntry } from './DiagnosisCatalogEntry';
import type { DiagnosisCatalogRepository } from './DiagnosisCatalogRepository';

const MAX_RESULTS = 50;

export class DiagnosisCatalog {
  constructor(private readonly entries: DiagnosisCatalogRepository) {}

  search(term: string | undefined, category: string | undefined): Promise<DiagnosisCatalogEntry[]> {
    return this.entries.search({
      term: term?.trim() || undefined,
      category: category?.trim() || undefined,
      limit: MAX_RESULTS,
    });
  }

  async findActive(code: string): Promise<DiagnosisCatalogEntry | null> {
    const entry = await this.entries.findByCode(code.trim().toUpperCase());
    return entry?.active ? entry : null;
  }
}
