import { Repository } from '#core/model/Repository';
import type { BookingRequest, BookingRequestStatus } from './BookingRequest';

// Repository
export abstract class BookingRequestRepository extends Repository<BookingRequest> {
  abstract findOwned(professionalId: string, id: string): Promise<BookingRequest | null>;
  abstract findPendingBetween(
    professionalId: string,
    from: Date,
    to: Date,
  ): Promise<BookingRequest[]>;
  abstract countPendingByDni(professionalId: string, dni: string): Promise<number>;
  abstract list(
    professionalId: string,
    status: BookingRequestStatus | null,
    limit: number,
  ): Promise<BookingRequest[]>;
  abstract findExpirable(now: Date, limit: number): Promise<BookingRequest[]>;
}
