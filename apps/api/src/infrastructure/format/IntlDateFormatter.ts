import { DateFormatter } from '#core/format/DateFormatter';

// Adapter
export class IntlDateFormatter extends DateFormatter {
  readonly #date: Intl.DateTimeFormat;
  readonly #time: Intl.DateTimeFormat;

  constructor(timeZone: string, locale = 'en-GB') {
    super();
    this.#date = new Intl.DateTimeFormat(locale, {
      timeZone,
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    this.#time = new Intl.DateTimeFormat(locale, {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  date(value: Date): string {
    return this.#date.format(value);
  }

  time(value: Date): string {
    return this.#time.format(value);
  }
}
