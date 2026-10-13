import { Presenter } from '#core/presenter/Presenter';
import type { AuthenticatedActor } from '#core/security/AuthenticatedActor';
import type { View } from '#core/view/View';
import type { PatientSummaryDto } from '../contracts/patients.contracts';
import type { PatientService } from '../model/PatientService';
import { PatientViewModel } from './PatientViewModel';

/** CU-05 Search patients. */
export class SearchPatientsPresenter extends Presenter<
  { actor: AuthenticatedActor; query: string | undefined },
  PatientSummaryDto[]
> {
  constructor(
    view: View<PatientSummaryDto[]>,
    private readonly patients: PatientService,
  ) {
    super(view);
  }

  protected async execute(input: { actor: AuthenticatedActor; query: string | undefined }) {
    const found = await this.patients.search(input.actor.professionalId, input.query);
    const now = this.patients.now;
    return found.map((patient) => PatientViewModel.toSummary(patient, now));
  }
}
