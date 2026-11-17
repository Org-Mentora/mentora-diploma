import type { DataMapper } from '#core/model/DataMapper';
import { BookingPage } from '../model/BookingPage';
import type { IsoWeekday } from '../model/LocalCalendar';
import type { BookingPageDocument } from './BookingPageSchema';

// Data Mapper
export class BookingPageMapper implements DataMapper<BookingPage, BookingPageDocument> {
  toDomain(record: BookingPageDocument): BookingPage {
    return BookingPage.restore(record._id, {
      slug: record.slug,
      enabled: record.enabled,
      slotMinutes: record.slotMinutes,
      minNoticeHours: record.minNoticeHours,
      horizonDays: record.horizonDays,
      modalities: [...record.modalities],
      weeklyHours: record.weeklyHours.map((w) => ({
        weekday: w.weekday as IsoWeekday,
        start: w.start,
        end: w.end,
      })),
      instructions: record.instructions,
      updatedAt: record.updatedAt,
    });
  }

  toPersistence(page: BookingPage): BookingPageDocument {
    const settings = page.settings;
    return {
      _id: page.professionalId,
      slug: page.slug,
      ...settings,
      updatedAt: page.updatedAt,
    };
  }
}
