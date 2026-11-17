import { Repository } from '#core/model/Repository';
import type { Appointment } from './Appointment';

// Repository
export abstract class AppointmentRepository extends Repository<Appointment> {
  abstract findOwned(professionalId: string, id: string): Promise<Appointment | null>;
  abstract findStartingBetween(
    professionalId: string,
    from: Date,
    to: Date,
  ): Promise<Appointment[]>;
  abstract findScheduledOverlapping(
    professionalId: string,
    startsAt: Date,
    endsAt: Date,
  ): Promise<Appointment[]>;
  abstract findNeedingReminder(from: Date, to: Date, limit: number): Promise<Appointment[]>;
}
