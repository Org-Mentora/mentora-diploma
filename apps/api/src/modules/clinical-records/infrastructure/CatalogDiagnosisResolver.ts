import type { DiagnosisCatalog } from '#modules/diagnosis-catalog';
import { DiagnosisResolver, type ResolvedDiagnosis } from '../model/DiagnosisResolver';

// Adapter
export class CatalogDiagnosisResolver extends DiagnosisResolver {
  constructor(private readonly catalog: DiagnosisCatalog) {
    super();
  }

  async resolve(code: string): Promise<ResolvedDiagnosis | null> {
    const entry = await this.catalog.findActive(code);
    return entry ? { code: entry.code, name: entry.name } : null;
  }
}
