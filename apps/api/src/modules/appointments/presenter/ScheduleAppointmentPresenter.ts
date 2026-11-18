import { Presenter } from '#core/presenter/Presenter';
import type { AuthenticatedActor } from '#core/security/AuthenticatedActor';
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

// Presenter
export class ScheduleAppointmentPresenter extends Presenter<
  ScheduleAppointmentInput,
  AppointmentDto,
  AppointmentService
> {
  protected async execute({ actor, data }: ScheduleAppointmentInput): Promise<AppointmentDto> {
    const entry = await this.model.schedule(
      actor.professionalId,
      data.patientId,
      AppointmentViewModel.toSlot(data),
    );
    return AppointmentViewModel.toDto(entry);
  }
}
