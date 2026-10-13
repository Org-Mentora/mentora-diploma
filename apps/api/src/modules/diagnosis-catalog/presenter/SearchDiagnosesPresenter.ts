import { Presenter } from '#core/presenter/Presenter';
import type { View } from '#core/view/View';
import type { DiagnosisCatalogEntryDto } from '../contracts/diagnosis-catalog.contracts';
import type { DiagnosisCatalog } from '../model/DiagnosisCatalog';

export interface SearchDiagnosesInput {
  term: string | undefined;
  category: string | undefined;
}

/** CU-11 steps 2-5: filter the DSM-5 catalog. */
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
