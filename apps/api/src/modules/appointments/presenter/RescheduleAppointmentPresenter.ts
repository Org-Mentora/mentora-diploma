import { Presenter } from '#core/presenter/Presenter';
import type {
  AppointmentDto,
  RescheduleAppointmentRequestDto,
} from '../contracts/appointments.contracts';
import type { AppointmentService } from '../model/AppointmentService';
import { AppointmentViewModel } from './AppointmentViewModel';
import type { AppointmentRef } from './GetAppointmentPresenter';

// Presenter
export class RescheduleAppointmentPresenter extends Presenter<
  AppointmentRef & { data: RescheduleAppointmentRequestDto },
  AppointmentDto,
  AppointmentService
> {
  protected async execute(
    input: AppointmentRef & { data: RescheduleAppointmentRequestDto },
  ): Promise<AppointmentDto> {
    const entry = await this.model.reschedule(
      input.actor.professionalId,
      input.appointmentId,
      AppointmentViewModel.toSlot(input.data),
    );
    return AppointmentViewModel.toDto(entry);
  }
}
