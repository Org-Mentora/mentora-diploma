import { MongooseRepository } from '#infrastructure/database/MongooseRepository';
import type { TransactionContext } from '#infrastructure/database/TransactionContext';
import type { BookingPage } from '../model/BookingPage';
import type { BookingPageRepository } from '../model/BookingPageRepository';
import { BookingPageMapper } from './BookingPageMapper';
import { type BookingPageDocument, BookingPageModel } from './BookingPageSchema';

// Repository, Adapter
export class MongooseBookingPageRepository
  extends MongooseRepository<BookingPage, BookingPageDocument>
  implements BookingPageRepository
{
  constructor(context: TransactionContext) {
    super(BookingPageModel, new BookingPageMapper(), context);
  }

  async findBySlug(slug: string): Promise<BookingPage | null> {
    return this.findOneBy({ slug });
  }
}
