import { Presenter } from '#core/presenter/Presenter';
import type { View } from '#core/view/View';
import type {
  AppointmentDto,
  RescheduleAppointmentRequestDto,
} from '../contracts/appointments.contracts';
import type { AppointmentService } from '../model/AppointmentService';
import { AppointmentViewModel } from './AppointmentViewModel';
import type { AppointmentRef } from './GetAppointmentPresenter';

/** CU-10 step 9: modify an appointment, re-checking availability. */
export class RescheduleAppointmentPresenter extends Presenter<
  AppointmentRef & { data: RescheduleAppointmentRequestDto },
  AppointmentDto
> {
  constructor(
    view: View<AppointmentDto>,
    private readonly agenda: AppointmentService,
  ) {
    super(view);
  }

  protected async execute(
    input: AppointmentRef & { data: RescheduleAppointmentRequestDto },
  ): Promise<AppointmentDto> {
    const entry = await this.agenda.reschedule(
      input.actor.professionalId,
      input.appointmentId,
      AppointmentViewModel.toSlot(input.data),
    );
    return AppointmentViewModel.toDto(entry);
  }
}
