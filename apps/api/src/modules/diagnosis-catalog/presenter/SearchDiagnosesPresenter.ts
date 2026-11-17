import { Presenter } from '#core/presenter/Presenter';
import type { View } from '#core/view/View';
import type { DiagnosisCatalogEntryDto } from '../contracts/diagnosis-catalog.contracts';
import type { DiagnosisCatalog } from '../model/DiagnosisCatalog';

export interface SearchDiagnosesInput {
  term: string | undefined;
  category: string | undefined;
}

// Presenter
export class SearchDiagnosesPresenter extends Presenter<
  SearchDiagnosesInput,
  DiagnosisCatalogEntryDto[]
> {
  constructor(
    view: View<DiagnosisCatalogEntryDto[]>,
    private readonly catalog: DiagnosisCatalog,
  ) {
    super(view);
  }

  protected async execute(input: SearchDiagnosesInput): Promise<DiagnosisCatalogEntryDto[]> {
    const entries = await this.catalog.search(input.term, input.category);
    return entries.map((entry) => ({
      code: entry.code,
      name: entry.name,
      category: entry.category,
    }));
  }
}
