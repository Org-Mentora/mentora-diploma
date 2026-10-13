import { ConflictError, NotFoundError, ValidationError } from '#core/errors/ApplicationError';
import type { Clock } from '#core/model/Clock';
import { Appointment, type AppointmentSlot } from './Appointment';
import type { AppointmentEvent, AppointmentNotifier } from './AppointmentNotifier';
import type { AppointmentRepository } from './AppointmentRepository';
import type { PatientNames } from './PatientNames';

/** An appointment with the patient name, as shown in the agenda (CU-10 step 5). */
export interface AgendaEntry {
  appointment: Appointment;
  patientName: string;
}

const MAX_RANGE_DAYS = 62;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Model service for CU-10 Manage appointments and agenda. */
export class AppointmentService {
  constructor(
    private readonly appointments: AppointmentRepository,
    private readonly patients: PatientNames,
    private readonly notifier: AppointmentNotifier,
    private readonly clock: Clock,
  ) {}

  /** Steps 2-5: month or day view. */
  async list(professionalId: string, from: Date, to: Date): Promise<AgendaEntry[]> {
    if (to.getTime() <= from.getTime()) {
      throw new ValidationError('`to` must be after `from`', { field: 'to' });
    }
    if (to.getTime() - from.getTime() > MAX_RANGE_DAYS * DAY_MS) {
      throw new ValidationError(`The range cannot exceed ${MAX_RANGE_DAYS} days`, { field: 'to' });
    }
    const found = await this.appointments.findStartingBetween(professionalId, from, to);
    return this.withNames(professionalId, found);
  }

  /** Step 8. */
  async get(professionalId: string, appointmentId: string): Promise<AgendaEntry> {
    const [entry] = await this.withNames(professionalId, [
      await this.getOwned(professionalId, appointmentId),
    ]);
    return entry as AgendaEntry;
  }

  /** Step 7. */
  async schedule(
    professionalId: string,
    patientId: string,
    slot: AppointmentSlot,
  ): Promise<AgendaEntry> {
    if (!(await this.patients.exists(professionalId, patientId))) {
      throw new NotFoundError('Patient', patientId);
    }
    const appointment = Appointment.schedule(professionalId, patientId, slot, this.clock.now());
    await this.assertSlotIsFree(appointment);
    await this.appointments.save(appointment);
    await this.safeNotify('scheduled', appointment);
    return this.get(professionalId, appointment.id);
  }

  /** Step 9. */
  async reschedule(
    professionalId: string,
    appointmentId: string,
    slot: AppointmentSlot,
  ): Promise<AgendaEntry> {
    const appointment = await this.getOwned(professionalId, appointmentId);
    appointment.reschedule(slot, this.clock.now());
    await this.assertSlotIsFree(appointment);
    await this.appointments.save(appointment);
    await this.safeNotify('rescheduled', appointment);
    return this.get(professionalId, appointment.id);
  }

  /** Step 10. */
  async cancel(professionalId: string, appointmentId: string): Promise<AgendaEntry> {
    const appointment = await this.getOwned(professionalId, appointmentId);
    appointment.cancel(this.clock.now());
    await this.appointments.save(appointment);
    await this.safeNotify('cancelled', appointment);
    return this.get(professionalId, appointment.id);
  }

  private async getOwned(professionalId: string, appointmentId: string): Promise<Appointment> {
    const appointment = await this.appointments.findOwned(professionalId, appointmentId);
    if (!appointment) {
      throw new NotFoundError('Appointment', appointmentId);
    }
    return appointment;
  }

  /** Steps 7 and 9 alternatives: the slot is already taken. */
  private async assertSlotIsFree(appointment: Appointment): Promise<void> {
    const candidates = await this.appointments.findScheduledOverlapping(
      appointment.professionalId,
      appointment.startsAt,
      appointment.endsAt,
    );
    const clash = candidates.find((other) => appointment.overlaps(other));
    if (clash) {
      throw new ConflictError('The selected time overlaps another appointment', {
        field: 'startsAt',
        appointmentId: clash.id,
      });
    }
  }

  /** CU-14: a failed notification never interrupts the use case that triggered it. */
  private async safeNotify(event: AppointmentEvent, appointment: Appointment): Promise<void> {
    try {
      await this.notifier.notify(event, appointment);
    } catch {
      // The notifier adapter is responsible for logging delivery failures.
    }
  }

  private async withNames(
    professionalId: string,
    appointments: Appointment[],
  ): Promise<AgendaEntry[]> {
    const names = await this.patients.fullNames(
      professionalId,
      appointments.map((a) => a.patientId),
    );
    return appointments.map((appointment) => ({
      appointment,
      patientName: names.get(appointment.patientId) ?? 'Unknown patient',
    }));
  }
}
