import { CursorCodec, type PageInput } from '#core/presenter/CursorCodec';
import { Presenter } from '#core/presenter/Presenter';
import type { DiagnosisCatalogPageDto } from '../contracts/diagnosis-catalog.contracts';
import type { DiagnosisCatalog } from '../model/DiagnosisCatalog';

export interface SearchDiagnosesInput extends PageInput {
  term: string | undefined;
  category?: string | undefined;
}

// Presenter
export class SearchDiagnosesPresenter extends Presenter<
  SearchDiagnosesInput,
  DiagnosisCatalogPageDto,
  DiagnosisCatalog
> {
  protected async execute(input: SearchDiagnosesInput): Promise<DiagnosisCatalogPageDto> {
    const page = await this.model.search(input.term, input.category, CursorCodec.request(input));
    return CursorCodec.toDto(page, (entry) => ({
      code: entry.code,
      name: entry.name,
      category: entry.category,
    }));
  }
}
