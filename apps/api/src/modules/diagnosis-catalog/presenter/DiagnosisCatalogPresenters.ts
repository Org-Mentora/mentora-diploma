import type { View } from '#core/view/View';
import type { DiagnosisCatalogPageDto } from '../contracts/diagnosis-catalog.contracts';
import type { DiagnosisCatalog } from '../model/DiagnosisCatalog';
import { SearchDiagnosesPresenter } from './SearchDiagnosesPresenter';

// Abstract Factory
export class DiagnosisCatalogPresenters {
  constructor(private readonly diagnosisCatalog: DiagnosisCatalog) {}

  searchDiagnoses(view: View<DiagnosisCatalogPageDto>) {
    return new SearchDiagnosesPresenter(view, this.diagnosisCatalog);
  }
}
