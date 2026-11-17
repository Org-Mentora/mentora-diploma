import type { View } from '#core/view/View';
import type {
  AppointmentDto,
  ConsultationFeesDto,
  EarningsReportDto,
} from '../contracts/appointments.contracts';
import type { CancelAppointmentPresenter } from './CancelAppointmentPresenter';
import type { GetAppointmentPresenter } from './GetAppointmentPresenter';
import type { GetConsultationFeesPresenter } from './GetConsultationFeesPresenter';
import type { GetEarningsReportPresenter } from './GetEarningsReportPresenter';
import type { ListAppointmentsPresenter } from './ListAppointmentsPresenter';
import type { RescheduleAppointmentPresenter } from './RescheduleAppointmentPresenter';
import type { ScheduleAppointmentPresenter } from './ScheduleAppointmentPresenter';
import type { UpdateConsultationFeesPresenter } from './UpdateConsultationFeesPresenter';

// Abstract Factory
export interface AppointmentPresenterFactory {
  listAppointments(view: View<AppointmentDto[]>): ListAppointmentsPresenter;
  getAppointment(view: View<AppointmentDto>): GetAppointmentPresenter;
  scheduleAppointment(view: View<AppointmentDto>): ScheduleAppointmentPresenter;
  rescheduleAppointment(view: View<AppointmentDto>): RescheduleAppointmentPresenter;
  cancelAppointment(view: View<AppointmentDto>): CancelAppointmentPresenter;
  getConsultationFees(view: View<ConsultationFeesDto>): GetConsultationFeesPresenter;
  updateConsultationFees(view: View<ConsultationFeesDto>): UpdateConsultationFeesPresenter;
  getEarningsReport(view: View<EarningsReportDto>): GetEarningsReportPresenter;
}
