import type { View } from '#core/view/View';
import type {
  AppointmentDto,
  AppointmentPageDto,
  ConsultationFeesDto,
  EarningsReportDto,
} from '../contracts/appointments.contracts';
import type { AppointmentService } from '../model/AppointmentService';
import type { EarningsService } from '../model/EarningsService';
import { CancelAppointmentPresenter } from './CancelAppointmentPresenter';
import { GetAppointmentPresenter } from './GetAppointmentPresenter';
import { GetConsultationFeesPresenter } from './GetConsultationFeesPresenter';
import { GetEarningsReportPresenter } from './GetEarningsReportPresenter';
import { ListAppointmentsPresenter } from './ListAppointmentsPresenter';
import { RescheduleAppointmentPresenter } from './RescheduleAppointmentPresenter';
import { ScheduleAppointmentPresenter } from './ScheduleAppointmentPresenter';
import { UpdateConsultationFeesPresenter } from './UpdateConsultationFeesPresenter';

// Abstract Factory
export class AppointmentPresenters {
  constructor(
    private readonly appointmentService: AppointmentService,
    private readonly earningsService: EarningsService,
  ) {}

  listAppointments(view: View<AppointmentPageDto>) {
    return new ListAppointmentsPresenter(view, this.appointmentService);
  }

  getAppointment(view: View<AppointmentDto>) {
    return new GetAppointmentPresenter(view, this.appointmentService);
  }

  scheduleAppointment(view: View<AppointmentDto>) {
    return new ScheduleAppointmentPresenter(view, this.appointmentService);
  }

  rescheduleAppointment(view: View<AppointmentDto>) {
    return new RescheduleAppointmentPresenter(view, this.appointmentService);
  }

  cancelAppointment(view: View<AppointmentDto>) {
    return new CancelAppointmentPresenter(view, this.appointmentService);
  }

  getConsultationFees(view: View<ConsultationFeesDto>) {
    return new GetConsultationFeesPresenter(view, this.earningsService);
  }

  updateConsultationFees(view: View<ConsultationFeesDto>) {
    return new UpdateConsultationFeesPresenter(view, this.earningsService);
  }

  getEarningsReport(view: View<EarningsReportDto>) {
    return new GetEarningsReportPresenter(view, this.earningsService);
  }
}
