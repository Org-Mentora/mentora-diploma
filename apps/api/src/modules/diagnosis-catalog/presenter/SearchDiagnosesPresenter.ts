import { CursorCodec, type PageInput } from '#core/presenter/CursorCodec';
import { Presenter } from '#core/presenter/Presenter';
import type { View } from '#core/view/View';
import type { DiagnosisCatalogPageDto } from '../contracts/diagnosis-catalog.contracts';
import type { DiagnosisCatalog } from '../model/DiagnosisCatalog';

export interface SearchDiagnosesInput extends PageInput {
  term: string | undefined;
  category?: string | undefined;
}

// Presenter
export class SearchDiagnosesPresenter extends Presenter<
  SearchDiagnosesInput,
  DiagnosisCatalogPageDto
> {
  constructor(
    view: View<DiagnosisCatalogPageDto>,
    private readonly catalog: DiagnosisCatalog,
  ) {
    super(view);
  }

  protected async execute(input: SearchDiagnosesInput): Promise<DiagnosisCatalogPageDto> {
    const page = await this.catalog.search(input.term, input.category, CursorCodec.request(input));
    return CursorCodec.toDto(page, (entry) => ({
      code: entry.code,
      name: entry.name,
      category: entry.category,
    }));
  }
}
