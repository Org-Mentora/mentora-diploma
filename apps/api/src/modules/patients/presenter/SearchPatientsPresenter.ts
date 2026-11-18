import { CursorCodec, type PageInput } from '#core/presenter/CursorCodec';
import { Presenter } from '#core/presenter/Presenter';
import type { AuthenticatedActor } from '#core/security/AuthenticatedActor';
import type { View } from '#core/view/View';
import type { PatientSummaryPageDto } from '../contracts/patients.contracts';
import type { PatientService } from '../model/PatientService';
import { PatientViewModel } from './PatientViewModel';

type SearchPatientsInput = PageInput & { actor: AuthenticatedActor; query: string | undefined };

// Presenter
export class SearchPatientsPresenter extends Presenter<SearchPatientsInput, PatientSummaryPageDto> {
  constructor(
    view: View<PatientSummaryPageDto>,
    private readonly patients: PatientService,
  ) {
    super(view);
  }

  protected async execute(input: SearchPatientsInput) {
    const page = await this.patients.search(
      input.actor.professionalId,
      input.query,
      CursorCodec.request(input),
    );
    const now = this.patients.now;
    return CursorCodec.toDto(page, (patient) => PatientViewModel.toSummary(patient, now));
  }
}
