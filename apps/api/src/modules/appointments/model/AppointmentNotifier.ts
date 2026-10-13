import type { Appointment } from './Appointment';

export type AppointmentEvent = 'scheduled' | 'rescheduled' | 'cancelled';

/**
 * Tells the patient about agenda changes (CU-14). The MVP adapter only logs; a WhatsApp
 * Business adapter will implement this same abstraction.
 */
export abstract class AppointmentNotifier {
  abstract notify(event: AppointmentEvent, appointment: Appointment): Promise<void>;
}
