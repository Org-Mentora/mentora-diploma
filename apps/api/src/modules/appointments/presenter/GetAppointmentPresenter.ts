import { Presenter } from '#core/presenter/Presenter';
import type { AuthenticatedActor } from '#core/security/AuthenticatedActor';
import type { View } from '#core/view/View';
import type { AppointmentDto } from '../contracts/appointments.contracts';
import type { AppointmentService } from '../model/AppointmentService';
import { AppointmentViewModel } from './AppointmentViewModel';

export interface AppointmentRef {
  actor: AuthenticatedActor;
  appointmentId: string;
}

/** CU-10 step 8: appointment detail. */
export class GetAppointmentPresenter extends Presenter<AppointmentRef, AppointmentDto> {
  constructor(
    view: View<AppointmentDto>,
    private readonly agenda: AppointmentService,
  ) {
    super(view);
  }

  protected async execute(input: AppointmentRef): Promise<AppointmentDto> {
    const entry = await this.agenda.get(input.actor.professionalId, input.appointmentId);
    return AppointmentViewModel.toDto(entry);
  }
}
