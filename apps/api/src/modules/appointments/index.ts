export {
  AppointmentsModule,
  type AppointmentsModuleDependencies,
} from './AppointmentsModule';
export type { AppointmentDto } from './contracts/appointments.contracts';
export type { AppointmentModality, AppointmentType } from './model/Appointment';
export type { AppointmentBooking, BookedSlot } from './model/AppointmentBooking';
export type { AppointmentDirectory, AppointmentSummary } from './model/AppointmentDirectory';
export type { BusyInterval } from './model/AppointmentService';
export { ConsultationFeesRepository } from './model/ConsultationFeesRepository';
