import { Presenter } from '#core/presenter/Presenter';
import type { AppointmentDto } from '../contracts/appointments.contracts';
import type { AppointmentService } from '../model/AppointmentService';
import { AppointmentViewModel } from './AppointmentViewModel';
import type { AppointmentRef } from './GetAppointmentPresenter';

// Presenter
export class CancelAppointmentPresenter extends Presenter<
  AppointmentRef,
  AppointmentDto,
  AppointmentService
> {
  protected async execute(input: AppointmentRef): Promise<AppointmentDto> {
    const entry = await this.model.cancel(input.actor.professionalId, input.appointmentId);
    return AppointmentViewModel.toDto(entry);
  }
}
