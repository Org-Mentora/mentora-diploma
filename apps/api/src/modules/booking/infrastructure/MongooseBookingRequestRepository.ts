import type { QueryFilter } from 'mongoose';
import type { Page, PageRequest } from '#core/model/Pagination';
import { Keyset } from '#infrastructure/database/Keyset';
import { MongooseRepository } from '#infrastructure/database/MongooseRepository';
import type { TransactionContext } from '#infrastructure/database/TransactionContext';
import type { BookingRequest, BookingRequestStatus } from '../model/BookingRequest';
import type { BookingRequestRepository } from '../model/BookingRequestRepository';
import { BookingRequestMapper } from './BookingRequestMapper';
import { type BookingRequestDocument, BookingRequestModel } from './BookingRequestSchema';

const SOONEST_FIRST = new Keyset([
  { path: 'startsAt', direction: 1, type: 'date' },
  { path: '_id', direction: 1 },
]);
const NEWEST_FIRST = new Keyset([
  { path: 'createdAt', direction: -1, type: 'date' },
  { path: '_id', direction: -1 },
]);

// Repository, Adapter
export class MongooseBookingRequestRepository
  extends MongooseRepository<BookingRequest, BookingRequestDocument>
  implements BookingRequestRepository
{
  constructor(context: TransactionContext) {
    super(BookingRequestModel, new BookingRequestMapper(), context);
  }

  async findOwned(professionalId: string, id: string): Promise<BookingRequest | null> {
    const record = await this.model
      .findOne({ _id: id, professionalId })
      .session(this.session)
      .lean<BookingRequestDocument>();
    return record ? this.mapper.toDomain(record) : null;
  }

  async findPendingBetween(
    professionalId: string,
    from: Date,
    to: Date,
  ): Promise<BookingRequest[]> {
    return this.findMany({
      professionalId,
      status: 'pending',
      startsAt: { $lt: to },
      endsAt: { $gt: from },
    });
  }

  async countPendingByDni(professionalId: string, dni: string): Promise<number> {
    return this.model
      .countDocuments({ professionalId, status: 'pending', 'requester.dni': dni })
      .session(this.session);
  }

  async list(
    professionalId: string,
    status: BookingRequestStatus | null,
    page: PageRequest,
  ): Promise<Page<BookingRequest>> {
    const query: QueryFilter<BookingRequestDocument> = { professionalId };
    if (status) {
      query.status = status;
    }
    const order = status === 'pending' ? SOONEST_FIRST : NEWEST_FIRST;
    const records = await this.model
      .find(order.where(query, page.after))
      .sort(order.sort())
      .limit(page.limit + 1)
      .session(this.session)
      .lean<BookingRequestDocument[]>();
    return order.page(records, page, (record) => this.mapper.toDomain(record));
  }

  async findExpirable(now: Date, limit: number): Promise<BookingRequest[]> {
    const records = await this.model
      .find({ status: 'pending', startsAt: { $lte: now } })
      .limit(limit)
      .session(this.session)
      .lean<BookingRequestDocument[]>();
    return records.map((record) => this.mapper.toDomain(record));
  }

  private async findMany(query: QueryFilter<BookingRequestDocument>): Promise<BookingRequest[]> {
    const records = await this.model
      .find(query)
      .session(this.session)
      .lean<BookingRequestDocument[]>();
    return records.map((record) => this.mapper.toDomain(record));
  }
}
