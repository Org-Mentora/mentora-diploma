import type { View } from '#core/view/View';
import type { DiagnosisCatalogPageDto } from '../contracts/diagnosis-catalog.contracts';
import type { SearchDiagnosesPresenter } from './SearchDiagnosesPresenter';

// Abstract Factory
export interface DiagnosisCatalogPresenterFactory {
  searchDiagnoses(view: View<DiagnosisCatalogPageDto>): SearchDiagnosesPresenter;
}
