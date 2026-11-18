import { Presenter } from '#core/presenter/Presenter';
import type { AuthenticatedActor } from '#core/security/AuthenticatedActor';
import type { AppointmentDto } from '../contracts/appointments.contracts';
import type { AppointmentService } from '../model/AppointmentService';
import { AppointmentViewModel } from './AppointmentViewModel';

export interface AppointmentRef {
  actor: AuthenticatedActor;
  appointmentId: string;
}

// Presenter
export class GetAppointmentPresenter extends Presenter<
  AppointmentRef,
  AppointmentDto,
  AppointmentService
> {
  protected async execute(input: AppointmentRef): Promise<AppointmentDto> {
    const entry = await this.model.get(input.actor.professionalId, input.appointmentId);
    return AppointmentViewModel.toDto(entry);
  }
}
