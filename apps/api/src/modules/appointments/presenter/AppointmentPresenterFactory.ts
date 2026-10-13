import type { View } from '#core/view/View';
import type { AppointmentDto } from '../contracts/appointments.contracts';
import type { CancelAppointmentPresenter } from './CancelAppointmentPresenter';
import type { GetAppointmentPresenter } from './GetAppointmentPresenter';
import type { ListAppointmentsPresenter } from './ListAppointmentsPresenter';
import type { RescheduleAppointmentPresenter } from './RescheduleAppointmentPresenter';
import type { ScheduleAppointmentPresenter } from './ScheduleAppointmentPresenter';

export interface AppointmentPresenterFactory {
  listAppointments(view: View<AppointmentDto[]>): ListAppointmentsPresenter;
  getAppointment(view: View<AppointmentDto>): GetAppointmentPresenter;
  scheduleAppointment(view: View<AppointmentDto>): ScheduleAppointmentPresenter;
  rescheduleAppointment(view: View<AppointmentDto>): RescheduleAppointmentPresenter;
  cancelAppointment(view: View<AppointmentDto>): CancelAppointmentPresenter;
}
