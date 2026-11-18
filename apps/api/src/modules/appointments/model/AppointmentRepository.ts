import type { Page, PageRequest } from '#core/model/Pagination';
import { Repository } from '#core/model/Repository';
import type { Appointment } from './Appointment';
import type { EarningsRow } from './EarningsReport';

// Repository
export abstract class AppointmentRepository extends Repository<Appointment> {
  abstract findOwned(professionalId: string, id: string): Promise<Appointment | null>;
  abstract findStartingBetween(
    professionalId: string,
    from: Date,
    to: Date,
    page: PageRequest,
  ): Promise<Page<Appointment>>;
  abstract findScheduledOverlapping(
    professionalId: string,
    startsAt: Date,
    endsAt: Date,
  ): Promise<Appointment[]>;
  abstract findNeedingReminder(from: Date, to: Date, limit: number): Promise<Appointment[]>;
  abstract earnings(
    professionalId: string,
    from: Date,
    to: Date,
    now: Date,
  ): Promise<EarningsRow[]>;
}
