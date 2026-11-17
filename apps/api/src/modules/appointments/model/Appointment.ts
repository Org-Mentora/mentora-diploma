import { ConflictError, ValidationError } from '#core/errors/ApplicationError';
import { Entity } from '#core/model/Entity';

export type AppointmentType = 'first_visit' | 'control' | 'follow_up' | 'medication' | 'other';
export type AppointmentModality = 'in_person' | 'virtual';
export type AppointmentStatus = 'scheduled' | 'cancelled';
export type AppointmentSource = 'agenda' | 'online';

export interface AppointmentSlot {
  startsAt: Date;
  durationMinutes: number;
  type: AppointmentType;
  modality: AppointmentModality;
  notes: string | null;
  fee: number | null;
}

export interface AppointmentProps extends AppointmentSlot {
  professionalId: string;
  source: AppointmentSource;
  patientId: string;
  status: AppointmentStatus;
  createdAt: Date;
  updatedAt: Date;
  cancelledAt: Date | null;
  reminderSentAt: Date | null;
}

const MINUTE_MS = 60_000;

// Aggregate Root
export class Appointment extends Entity<AppointmentProps> {
  static readonly MIN_DURATION = 10;
  static readonly MAX_DURATION = 240;
  static readonly REMINDER_WINDOW_MS = 24 * 60 * MINUTE_MS;
  static readonly MAX_FEE = 100_000_000;

  static schedule(
    id: string,
    professionalId: string,
    patientId: string,
    slot: AppointmentSlot,
    now: Date,
    source: AppointmentSource = 'agenda',
  ) {
    Appointment.validateSlot(slot, now);
    return new Appointment(id, {
      ...slot,
      notes: slot.notes?.trim() || null,
      professionalId,
      source,
      patientId,
      status: 'scheduled',
      createdAt: now,
      updatedAt: now,
      cancelledAt: null,
      reminderSentAt: Appointment.confirmationCoversReminder(slot.startsAt, now) ? now : null,
    });
  }

  static restore(id: string, props: AppointmentProps): Appointment {
    return new Appointment(id, props);
  }

  private static confirmationCoversReminder(startsAt: Date, now: Date): boolean {
    return startsAt.getTime() - now.getTime() <= Appointment.REMINDER_WINDOW_MS;
  }

  static endOf(startsAt: Date, durationMinutes: number): Date {
    return new Date(startsAt.getTime() + durationMinutes * MINUTE_MS);
  }

  private static validateSlot(slot: AppointmentSlot, now: Date): void {
    const { durationMinutes } = slot;
    if (
      !Number.isInteger(durationMinutes) ||
      durationMinutes < Appointment.MIN_DURATION ||
      durationMinutes > Appointment.MAX_DURATION
    ) {
      throw new ValidationError(
        `Duration must be between ${Appointment.MIN_DURATION} and ${Appointment.MAX_DURATION} minutes`,
        { field: 'durationMinutes' },
      );
    }
    if (
      slot.fee !== null &&
      (!Number.isFinite(slot.fee) || slot.fee < 0 || slot.fee > Appointment.MAX_FEE)
    ) {
      throw new ValidationError('The fee must be a positive amount', { field: 'fee' });
    }
    if (slot.startsAt.getTime() < now.getTime()) {
      throw new ValidationError('Appointments cannot be scheduled in the past', {
        field: 'startsAt',
      });
    }
  }

  reschedule(slot: AppointmentSlot, now: Date): void {
    this.assertScheduled();
    Appointment.validateSlot(slot, now);
    const moved = slot.startsAt.getTime() !== this.props.startsAt.getTime();
    this.props = {
      ...this.props,
      ...slot,
      notes: slot.notes?.trim() || null,
      updatedAt: now,
      reminderSentAt: moved
        ? Appointment.confirmationCoversReminder(slot.startsAt, now)
          ? now
          : null
        : this.props.reminderSentAt,
    };
  }

  cancel(now: Date): void {
    this.assertScheduled();
    this.props = { ...this.props, status: 'cancelled', cancelledAt: now, updatedAt: now };
  }

  markReminderSent(now: Date): void {
    this.props = { ...this.props, reminderSentAt: now };
  }

  needsReminderAt(now: Date, windowMs: number): boolean {
    const start = this.props.startsAt.getTime();
    return (
      this.isScheduled &&
      this.props.reminderSentAt === null &&
      start > now.getTime() &&
      start <= now.getTime() + windowMs
    );
  }

  overlaps(other: Appointment): boolean {
    return (
      this.id !== other.id &&
      this.isScheduled &&
      other.isScheduled &&
      this.startsAt.getTime() < other.endsAt.getTime() &&
      other.startsAt.getTime() < this.endsAt.getTime()
    );
  }

  private assertScheduled(): void {
    if (!this.isScheduled) {
      throw new ConflictError('This appointment was cancelled and can no longer be changed');
    }
  }

  get professionalId(): string {
    return this.props.professionalId;
  }

  get patientId(): string {
    return this.props.patientId;
  }

  get startsAt(): Date {
    return this.props.startsAt;
  }

  get endsAt(): Date {
    return Appointment.endOf(this.props.startsAt, this.props.durationMinutes);
  }

  get durationMinutes(): number {
    return this.props.durationMinutes;
  }

  get type(): AppointmentType {
    return this.props.type;
  }

  get modality(): AppointmentModality {
    return this.props.modality;
  }

  get notes(): string | null {
    return this.props.notes;
  }

  get fee(): number | null {
    return this.props.fee;
  }

  get source(): AppointmentSource {
    return this.props.source;
  }

  get status(): AppointmentStatus {
    return this.props.status;
  }

  get isScheduled(): boolean {
    return this.props.status === 'scheduled';
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get cancelledAt(): Date | null {
    return this.props.cancelledAt;
  }

  get reminderSentAt(): Date | null {
    return this.props.reminderSentAt;
  }
}
