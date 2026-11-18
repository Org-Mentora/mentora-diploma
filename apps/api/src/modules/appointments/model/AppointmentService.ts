import { ConflictError, NotFoundError, ValidationError } from '#core/errors/ApplicationError';
import type { AuditTrail } from '#core/model/AuditTrail';
import type { Clock } from '#core/model/Clock';
import type { IdGenerator } from '#core/model/IdGenerator';
import type { Page, PageRequest } from '#core/model/Pagination';
import type { TransactionManager } from '#core/model/TransactionManager';
import type { AgendaLock } from './AgendaLock';
import { Appointment, type AppointmentSlot } from './Appointment';
import type { AppointmentEvent, AppointmentNotifier } from './AppointmentNotifier';
import type { AppointmentRepository } from './AppointmentRepository';
import type { ConsultationFeesRepository } from './ConsultationFeesRepository';
import type { PatientNames } from './PatientNames';

export type SlotRequest = Omit<AppointmentSlot, 'fee'> & { fee?: number | null };

export interface BusyInterval {
  startsAt: Date;
  endsAt: Date;
}

export interface AgendaEntry {
  appointment: Appointment;
  patientName: string;
}

const MAX_RANGE_DAYS = 62;
const REMINDER_BATCH = 200;
const DAY_MS = 24 * 60 * 60 * 1000;

export class AppointmentService {
  constructor(
    private readonly appointments: AppointmentRepository,
    private readonly transactions: TransactionManager,
    private readonly patients: PatientNames,
    private readonly notifier: AppointmentNotifier,
    private readonly clock: Clock,
    private readonly lock: AgendaLock,
    private readonly ids: IdGenerator,
    private readonly fees: ConsultationFeesRepository,
    private readonly audit: AuditTrail,
  ) {}

  async list(
    professionalId: string,
    from: Date,
    to: Date,
    page: PageRequest,
  ): Promise<Page<AgendaEntry>> {
    if (to.getTime() <= from.getTime()) {
      throw new ValidationError('`to` must be after `from`', { field: 'to' });
    }
    if (to.getTime() - from.getTime() > MAX_RANGE_DAYS * DAY_MS) {
      throw new ValidationError(`The range cannot exceed ${MAX_RANGE_DAYS} days`, { field: 'to' });
    }
    const found = await this.appointments.findStartingBetween(professionalId, from, to, page);
    return { items: await this.withNames(professionalId, found.items), next: found.next };
  }

  async get(professionalId: string, appointmentId: string): Promise<AgendaEntry> {
    const [entry] = await this.withNames(professionalId, [
      await this.getOwned(professionalId, appointmentId),
    ]);
    return entry as AgendaEntry;
  }

  async schedule(
    professionalId: string,
    patientId: string,
    request: SlotRequest,
  ): Promise<AgendaEntry> {
    const appointment = await this.transactions.run(() =>
      this.insert(professionalId, patientId, request, 'agenda'),
    );
    await this.safeNotify('scheduled', appointment);
    return this.get(professionalId, appointment.id);
  }

  book(professionalId: string, patientId: string, request: SlotRequest): Promise<Appointment> {
    return this.transactions.run(() => this.insert(professionalId, patientId, request, 'online'));
  }

  async confirmBooked(professionalId: string, appointmentId: string): Promise<void> {
    const appointment = await this.appointments.findOwned(professionalId, appointmentId);
    if (appointment?.isScheduled) {
      await this.safeNotify('scheduled', appointment);
    }
  }

  async busyIntervals(professionalId: string, from: Date, to: Date): Promise<BusyInterval[]> {
    const found = await this.appointments.findScheduledOverlapping(professionalId, from, to);
    return found.map((a) => ({ startsAt: a.startsAt, endsAt: a.endsAt }));
  }

  private async insert(
    professionalId: string,
    patientId: string,
    request: SlotRequest,
    source: 'agenda' | 'online',
  ): Promise<Appointment> {
    if (!(await this.patients.exists(professionalId, patientId))) {
      throw new NotFoundError('Patient', patientId);
    }
    await this.lock.acquire(professionalId);
    const fee =
      request.fee === undefined
        ? ((await this.fees.findById(professionalId))?.feeFor(request.type) ?? null)
        : request.fee;
    const scheduled = Appointment.schedule(
      this.ids.next(),
      professionalId,
      patientId,
      { ...request, fee },
      this.clock.now(),
      source,
    );
    await this.assertSlotIsFree(scheduled);
    await this.appointments.save(scheduled);
    await this.record('appointment.scheduled', scheduled, { source });
    return scheduled;
  }

  async reschedule(
    professionalId: string,
    appointmentId: string,
    request: SlotRequest,
  ): Promise<AgendaEntry> {
    const appointment = await this.transactions.run(async () => {
      await this.lock.acquire(professionalId);
      const found = await this.getOwned(professionalId, appointmentId);
      const fee = request.fee === undefined ? found.fee : request.fee;
      found.reschedule({ ...request, fee }, this.clock.now());
      await this.assertSlotIsFree(found);
      await this.appointments.save(found);
      await this.record('appointment.rescheduled', found);
      return found;
    });
    await this.safeNotify('rescheduled', appointment);
    return this.get(professionalId, appointment.id);
  }

  async cancel(professionalId: string, appointmentId: string): Promise<AgendaEntry> {
    const appointment = await this.transactions.run(async () => {
      const found = await this.getOwned(professionalId, appointmentId);
      found.cancel(this.clock.now());
      await this.appointments.save(found);
      await this.record('appointment.cancelled', found);
      return found;
    });
    await this.safeNotify('cancelled', appointment);
    return this.get(professionalId, appointment.id);
  }

  async sendDueReminders(): Promise<number> {
    const now = this.clock.now();
    const due = await this.appointments.findNeedingReminder(
      now,
      new Date(now.getTime() + Appointment.REMINDER_WINDOW_MS),
      REMINDER_BATCH,
    );
    let sent = 0;
    for (const candidate of due) {
      const claimed = await this.transactions.run(async () => {
        const appointment = await this.appointments.findById(candidate.id);
        if (!appointment?.needsReminderAt(now, Appointment.REMINDER_WINDOW_MS)) {
          return null;
        }
        appointment.markReminderSent(now);
        await this.appointments.save(appointment);
        return appointment;
      });
      if (claimed) {
        await this.safeNotify('reminder', claimed);
        sent += 1;
      }
    }
    return sent;
  }

  private async getOwned(professionalId: string, appointmentId: string): Promise<Appointment> {
    const appointment = await this.appointments.findOwned(professionalId, appointmentId);
    if (!appointment) {
      throw new NotFoundError('Appointment', appointmentId);
    }
    return appointment;
  }

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

  private record(
    action: string,
    appointment: Appointment,
    extra: Record<string, string> = {},
  ): Promise<void> {
    return this.audit.record({
      professionalId: appointment.professionalId,
      action,
      target: { type: 'appointment', id: appointment.id },
      details: {
        patientId: appointment.patientId,
        startsAt: appointment.startsAt.toISOString(),
        type: appointment.type,
        ...extra,
      },
    });
  }

  private async safeNotify(event: AppointmentEvent, appointment: Appointment): Promise<void> {
    try {
      await this.notifier.notify(event, appointment);
    } catch {}
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
