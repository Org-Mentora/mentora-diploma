import { Repository } from '#core/model/Repository';
import type { BookingPage } from './BookingPage';

// Repository
export abstract class BookingPageRepository extends Repository<BookingPage> {
  abstract findBySlug(slug: string): Promise<BookingPage | null>;
}
