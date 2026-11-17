import { LocalCalendar } from '../model/LocalCalendar';

const PARTS = ['year', 'month', 'day', 'hour', 'minute'] as const;

// Adapter
export class IntlLocalCalendar extends LocalCalendar {
  readonly #format: Intl.DateTimeFormat;

  constructor(readonly timezone: string) {
    super();
    this.#format = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    });
  }

  dateOf(instant: Date): string {
    const { year, month, day } = this.wallClock(instant);
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  instantOf(date: string, time: string): Date {
    const [year, month, day] = date.split('-').map(Number) as [number, number, number];
    const [hour, minute] = time.split(':').map(Number) as [number, number];
    const wall = Date.UTC(year, month - 1, day, hour, minute);
    let instant = wall - this.offsetAt(new Date(wall));
    instant = wall - this.offsetAt(new Date(instant));
    return new Date(instant);
  }

  private offsetAt(instant: Date): number {
    const w = this.wallClock(instant);
    const asUtc = Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute);
    return asUtc - Math.floor(instant.getTime() / 60_000) * 60_000;
  }

  private wallClock(instant: Date): Record<(typeof PARTS)[number], number> {
    const parts = Object.fromEntries(
      this.#format.formatToParts(instant).map((part) => [part.type, part.value]),
    );
    return Object.fromEntries(PARTS.map((key) => [key, Number(parts[key])])) as Record<
      (typeof PARTS)[number],
      number
    >;
  }
}
