import { Presenter } from '#core/presenter/Presenter';
import type { AuthenticatedActor } from '#core/security/AuthenticatedActor';
import type { View } from '#core/view/View';
import type {
  AppointmentDto,
  ScheduleAppointmentRequestDto,
} from '../contracts/appointments.contracts';
import type { AppointmentService } from '../model/AppointmentService';
import { AppointmentViewModel } from './AppointmentViewModel';

export interface ScheduleAppointmentInput {
  actor: AuthenticatedActor;
  data: ScheduleAppointmentRequestDto;
}

/** CU-10 step 7: create an appointment, rejecting overlaps. */
export class ScheduleAppointmentPresenter extends Presenter<
  ScheduleAppointmentInput,
  AppointmentDto
> {
  constructor(
    view: View<AppointmentDto>,
    private readonly agenda: AppointmentService,
  ) {
    super(view);
  }

  protected async execute({ actor, data }: ScheduleAppointmentInput): Promise<AppointmentDto> {
    const entry = await this.agenda.schedule(
      actor.professionalId,
      data.patientId,
      AppointmentViewModel.toSlot(data),
    );
    return AppointmentViewModel.toDto(entry);
  }
}
