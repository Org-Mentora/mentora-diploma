import { ConflictError, ValidationError } from '#core/errors/ApplicationError';
import { Entity } from '#core/model/Entity';

/** CU-10 consultation categories: first visit, control, follow-up, medication, other. */
export type AppointmentType = 'first_visit' | 'control' | 'follow_up' | 'medication' | 'other';
export type AppointmentModality = 'in_person' | 'virtual';
export type AppointmentStatus = 'scheduled' | 'cancelled';

export interface AppointmentSlot {
  startsAt: Date;
  durationMinutes: number;
  type: AppointmentType;
  modality: AppointmentModality;
  notes: string | null;
}

export interface AppointmentProps extends AppointmentSlot {
  professionalId: string;
  patientId: string;
  status: AppointmentStatus;
  createdAt: Date;
  updatedAt: Date;
  cancelledAt: Date | null;
}

const MINUTE_MS = 60_000;

/** An appointment in the professional's agenda (`Turno`). */
export class Appointment extends Entity<AppointmentProps> {
  static readonly MIN_DURATION = 10;
  static readonly MAX_DURATION = 240;

  static schedule(professionalId: string, patientId: string, slot: AppointmentSlot, now: Date) {
    Appointment.validateSlot(slot, now);
    return new Appointment(crypto.randomUUID(), {
      ...slot,
      notes: slot.notes?.trim() || null,
      professionalId,
      patientId,
      status: 'scheduled',
      createdAt: now,
      updatedAt: now,
      cancelledAt: null,
    });
  }

  static restore(id: string, props: AppointmentProps): Appointment {
    return new Appointment(id, props);
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
    if (slot.startsAt.getTime() < now.getTime()) {
      throw new ValidationError('Appointments cannot be scheduled in the past', {
        field: 'startsAt',
      });
    }
  }

  /** CU-10 step 9: change the slot. Cancelled appointments cannot be modified. */
  reschedule(slot: AppointmentSlot, now: Date): void {
    this.assertScheduled();
    Appointment.validateSlot(slot, now);
    this.props = { ...this.props, ...slot, notes: slot.notes?.trim() || null, updatedAt: now };
  }

  /** CU-10 step 10. */
  cancel(now: Date): void {
    this.assertScheduled();
    this.props = { ...this.props, status: 'cancelled', cancelledAt: now, updatedAt: now };
  }

  /** True when both appointments are scheduled and their time ranges intersect. */
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
}
