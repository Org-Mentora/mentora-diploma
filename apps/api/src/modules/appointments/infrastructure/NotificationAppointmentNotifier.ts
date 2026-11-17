import type { AppLogger } from '#core/logging/AppLogger';
import type { DateTimeFormatter } from '#infrastructure/format/DateTimeFormatter';
import type { NotificationCenter, NotificationTopic } from '#modules/notifications';
import type { PatientDirectory } from '#modules/patients';
import type { Appointment } from '../model/Appointment';
import { type AppointmentEvent, AppointmentNotifier } from '../model/AppointmentNotifier';

const TOPIC: Record<AppointmentEvent, NotificationTopic> = {
  scheduled: 'appointment_scheduled',
  rescheduled: 'appointment_rescheduled',
  cancelled: 'appointment_cancelled',
  reminder: 'appointment_reminder',
};

// Adapter
export class NotificationAppointmentNotifier extends AppointmentNotifier {
  constructor(
    private readonly patients: PatientDirectory,
    private readonly notifications: NotificationCenter,
    private readonly dates: DateTimeFormatter,
    private readonly logger: AppLogger,
  ) {
    super();
  }

  async notify(event: AppointmentEvent, appointment: Appointment): Promise<void> {
    try {
      await this.deliver(event, appointment);
    } catch (error) {
      this.logger.warn('Appointment message could not be delivered', {
        event,
        appointmentId: appointment.id,
        err: error,
      });
      throw error;
    }
  }

  private async deliver(event: AppointmentEvent, appointment: Appointment): Promise<void> {
    const contacts = await this.patients.contacts(appointment.professionalId, [
      appointment.patientId,
    ]);
    const contact = contacts.get(appointment.patientId);
    if (!contact) {
      return;
    }
    await this.notifications.send({
      professionalId: appointment.professionalId,
      patientId: appointment.patientId,
      phone: contact.phone,
      email: contact.email,
      topic: TOPIC[event],
      body: this.compose(event, contact.fullName, appointment),
    });
  }

  private compose(event: AppointmentEvent, name: string, appointment: Appointment): string {
    const when = this.dates.dateTime(appointment.startsAt);
    const how = appointment.modality === 'virtual' ? 'virtual' : 'in-person';
    switch (event) {
      case 'scheduled':
        return `Hello ${name}! Your ${how} appointment is confirmed for ${when} (${appointment.durationMinutes} min).`;
      case 'rescheduled':
        return `Hello ${name}. Your appointment was rescheduled to ${when} (${how}).`;
      case 'cancelled':
        return `Hello ${name}. Your appointment of ${when} was cancelled. Contact the practice to book a new one.`;
      case 'reminder':
        return `Reminder: ${name}, you have a ${how} appointment on ${when}.`;
    }
  }
}
