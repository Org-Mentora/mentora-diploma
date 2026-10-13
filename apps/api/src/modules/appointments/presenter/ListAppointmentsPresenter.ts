import { Presenter } from '#core/presenter/Presenter';
import type { AuthenticatedActor } from '#core/security/AuthenticatedActor';
import type { View } from '#core/view/View';
import type { AppointmentDto } from '../contracts/appointments.contracts';
import type { AppointmentService } from '../model/AppointmentService';
import { AppointmentViewModel } from './AppointmentViewModel';

export interface ListAppointmentsInput {
  actor: AuthenticatedActor;
  from: string;
  to: string;
}

/** CU-10 steps 2-5: appointments of the visible month or the selected day. */
export class ListAppointmentsPresenter extends Presenter<ListAppointmentsInput, AppointmentDto[]> {
  constructor(
    view: View<AppointmentDto[]>,
    private readonly agenda: AppointmentService,
  ) {
    super(view);
  }

  protected async execute(input: ListAppointmentsInput): Promise<AppointmentDto[]> {
    const entries = await this.agenda.list(
      input.actor.professionalId,
      new Date(input.from),
      new Date(input.to),
    );
    return entries.map((entry) => AppointmentViewModel.toDto(entry));
  }
}
