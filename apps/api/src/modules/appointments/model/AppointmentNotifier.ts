import type { Appointment } from './Appointment';

export type AppointmentEvent = 'scheduled' | 'rescheduled' | 'cancelled' | 'reminder';

export abstract class AppointmentNotifier {
  abstract notify(event: AppointmentEvent, appointment: Appointment): Promise<void>;
}
