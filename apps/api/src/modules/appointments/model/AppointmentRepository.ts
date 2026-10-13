import { Repository } from '#core/model/Repository';
import type { Appointment } from './Appointment';

/** Every query is scoped to one professional (ADR-0019). */
export abstract class AppointmentRepository extends Repository<Appointment> {
  abstract findOwned(professionalId: string, id: string): Promise<Appointment | null>;
  /** Appointments starting in `[from, to)`, ordered by start time. */
  abstract findStartingBetween(
    professionalId: string,
    from: Date,
    to: Date,
  ): Promise<Appointment[]>;
  /** Scheduled appointments whose range intersects `[startsAt, endsAt)`. */
  abstract findScheduledOverlapping(
    professionalId: string,
    startsAt: Date,
    endsAt: Date,
  ): Promise<Appointment[]>;
}
