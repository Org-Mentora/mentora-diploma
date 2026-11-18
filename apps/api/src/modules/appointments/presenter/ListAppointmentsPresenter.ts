import { CursorCodec, type PageInput } from '#core/presenter/CursorCodec';
import { Presenter } from '#core/presenter/Presenter';
import type { AuthenticatedActor } from '#core/security/AuthenticatedActor';
import type { AppointmentPageDto } from '../contracts/appointments.contracts';
import type { AppointmentService } from '../model/AppointmentService';
import { AppointmentViewModel } from './AppointmentViewModel';

export interface ListAppointmentsInput extends PageInput {
  actor: AuthenticatedActor;
  from: string;
  to: string;
}

// Presenter
export class ListAppointmentsPresenter extends Presenter<
  ListAppointmentsInput,
  AppointmentPageDto,
  AppointmentService
> {
  protected async execute(input: ListAppointmentsInput): Promise<AppointmentPageDto> {
    const page = await this.model.list(
      input.actor.professionalId,
      new Date(input.from),
      new Date(input.to),
      CursorCodec.request(input),
    );
    return CursorCodec.toDto(page, (entry) => AppointmentViewModel.toDto(entry));
  }
}
