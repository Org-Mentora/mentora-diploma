import type { BookingPage } from './BookingPage';
import { LocalCalendar } from './LocalCalendar';

export interface Interval {
  startsAt: Date;
  endsAt: Date;
}

export interface DaySlots {
  date: string;
  slots: Date[];
}

const HOUR_MS = 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;

// Strategy
export class SlotPlanner {
  constructor(private readonly calendar: LocalCalendar) {}

  bounds(page: BookingPage, now: Date): Interval {
    return {
      startsAt: new Date(now.getTime() + page.minNoticeHours * HOUR_MS),
      endsAt: new Date(now.getTime() + page.horizonDays * 24 * HOUR_MS),
    };
  }

  plan(page: BookingPage, now: Date, from: string, days: number, busy: Interval[]): DaySlots[] {
    const { startsAt: earliest, endsAt: latest } = this.bounds(page, now);
    const step = page.slotMinutes * MINUTE_MS;
    return Array.from({ length: days }, (_, offset) => {
      const date = LocalCalendar.addDays(from, offset);
      const slots: Date[] = [];
      for (const window of page.windowsOn(LocalCalendar.weekdayOf(date))) {
        const end = this.calendar.instantOf(date, window.end).getTime();
        for (
          let start = this.calendar.instantOf(date, window.start).getTime();
          start + step <= end;
          start += step
        ) {
          const slot = { startsAt: new Date(start), endsAt: new Date(start + step) };
          if (
            start >= earliest.getTime() &&
            start <= latest.getTime() &&
            !busy.some((b) => SlotPlanner.overlaps(slot, b))
          ) {
            slots.push(slot.startsAt);
          }
        }
      }
      return { date, slots };
    });
  }

  isAvailable(page: BookingPage, now: Date, startsAt: Date, busy: Interval[]): boolean {
    const date = this.calendar.dateOf(startsAt);
    const [day] = this.plan(page, now, date, 1, busy);
    return day?.slots.some((slot) => slot.getTime() === startsAt.getTime()) ?? false;
  }

  static overlaps(a: Interval, b: Interval): boolean {
    return a.startsAt.getTime() < b.endsAt.getTime() && b.startsAt.getTime() < a.endsAt.getTime();
  }
}
