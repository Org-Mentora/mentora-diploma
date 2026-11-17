import { Presenter } from '#core/presenter/Presenter';
import type { View } from '#core/view/View';
import type { AppointmentDto } from '../contracts/appointments.contracts';
import type { AppointmentService } from '../model/AppointmentService';
import { AppointmentViewModel } from './AppointmentViewModel';
import type { AppointmentRef } from './GetAppointmentPresenter';

// Presenter
export class CancelAppointmentPresenter extends Presenter<AppointmentRef, AppointmentDto> {
  constructor(
    view: View<AppointmentDto>,
    private readonly agenda: AppointmentService,
  ) {
    super(view);
  }

  protected async execute(input: AppointmentRef): Promise<AppointmentDto> {
    const entry = await this.agenda.cancel(input.actor.professionalId, input.appointmentId);
    return AppointmentViewModel.toDto(entry);
  }
}
