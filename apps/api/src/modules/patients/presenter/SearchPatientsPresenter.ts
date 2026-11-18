import { CursorCodec, type PageInput } from '#core/presenter/CursorCodec';
import { Presenter } from '#core/presenter/Presenter';
import type { AuthenticatedActor } from '#core/security/AuthenticatedActor';
import type { PatientSummaryPageDto } from '../contracts/patients.contracts';
import type { PatientService } from '../model/PatientService';
import { PatientViewModel } from './PatientViewModel';

type SearchPatientsInput = PageInput & { actor: AuthenticatedActor; query: string | undefined };

// Presenter
export class SearchPatientsPresenter extends Presenter<
  SearchPatientsInput,
  PatientSummaryPageDto,
  PatientService
> {
  protected async execute(input: SearchPatientsInput) {
    const page = await this.model.search(
      input.actor.professionalId,
      input.query,
      CursorCodec.request(input),
    );
    const now = this.model.now;
    return CursorCodec.toDto(page, (patient) => PatientViewModel.toSummary(patient, now));
  }
}
