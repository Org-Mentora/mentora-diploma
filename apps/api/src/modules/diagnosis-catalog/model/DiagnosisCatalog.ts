import type { Page, PageRequest } from '#core/model/Pagination';
import type { DiagnosisCatalogEntry } from './DiagnosisCatalogEntry';
import type { DiagnosisCatalogRepository } from './DiagnosisCatalogRepository';

export class DiagnosisCatalog {
  constructor(private readonly entries: DiagnosisCatalogRepository) {}

  search(
    term: string | undefined,
    category: string | undefined,
    page: PageRequest,
  ): Promise<Page<DiagnosisCatalogEntry>> {
    return this.entries.search({
      term: term?.trim() || undefined,
      category: category?.trim() || undefined,
      page,
    });
  }

  async findActive(code: string): Promise<DiagnosisCatalogEntry | null> {
    const entry = await this.entries.findByCode(code.trim().toUpperCase());
    return entry?.active ? entry : null;
  }
}
