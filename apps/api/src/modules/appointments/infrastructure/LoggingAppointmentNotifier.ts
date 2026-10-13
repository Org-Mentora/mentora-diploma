import type { AppLogger } from '#core/logging/AppLogger';
import type { Appointment } from '../model/Appointment';
import { type AppointmentEvent, AppointmentNotifier } from '../model/AppointmentNotifier';

/**
 * Adapter (ADR-0007): MVP stand-in for the WhatsApp Business notifier of CU-14.
 * It records what would have been sent so the integration point is already wired.
 */
export class LoggingAppointmentNotifier extends AppointmentNotifier {
  constructor(private readonly logger: AppLogger) {
    super();
  }

  async notify(event: AppointmentEvent, appointment: Appointment): Promise<void> {
    this.logger.info('Patient notification (WhatsApp pending integration)', {
      event,
      appointmentId: appointment.id,
      patientId: appointment.patientId,
      startsAt: appointment.startsAt.toISOString(),
    });
  }
}
