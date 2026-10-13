import type { View } from '#core/view/View';
import type { DiagnosisCatalogEntryDto } from '../contracts/diagnosis-catalog.contracts';
import type { SearchDiagnosesPresenter } from './SearchDiagnosesPresenter';

export interface DiagnosisCatalogPresenterFactory {
  searchDiagnoses(view: View<DiagnosisCatalogEntryDto[]>): SearchDiagnosesPresenter;
}
