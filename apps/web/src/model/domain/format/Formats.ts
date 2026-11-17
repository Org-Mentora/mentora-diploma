import { intlLocale } from '@/shared/i18n';

type Style = 'date' | 'shortDate' | 'dateTime' | 'shortDateTime' | 'time';

const OPTIONS: Record<Style, Intl.DateTimeFormatOptions> = {
  date: { day: 'numeric', month: 'short', year: 'numeric' },
  shortDate: { day: '2-digit', month: '2-digit', year: 'numeric' },
  dateTime: {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  },
  shortDateTime: {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  },
  time: { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' },
};

// Adapter
export class Formats {
  static date(value: string | Date, style: Style = 'date', timeZone?: string): string {
    return new Intl.DateTimeFormat(intlLocale(), {
      ...OPTIONS[style],
      ...(timeZone ? { timeZone } : {}),
    }).format(new Date(value));
  }

  static weekday(isoWeekday: number, width: 'long' | 'short' = 'long'): string {
    const monday = new Date(Date.UTC(2024, 0, 1));
    const day = new Date(monday.getTime() + (isoWeekday - 1) * 86_400_000);
    return new Intl.DateTimeFormat(intlLocale(), { weekday: width, timeZone: 'UTC' }).format(day);
  }

  static dayHeading(isoDate: string): string {
    const [year, month, day] = isoDate.split('-').map(Number) as [number, number, number];
    return new Intl.DateTimeFormat(intlLocale(), {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      timeZone: 'UTC',
    }).format(new Date(Date.UTC(year, month - 1, day)));
  }

  static month(isoMonth: string, width: 'long' | 'short' = 'short'): string {
    const [year, month] = isoMonth.split('-').map(Number) as [number, number];
    return new Intl.DateTimeFormat(intlLocale(), {
      month: width,
      year: width === 'long' ? 'numeric' : '2-digit',
      timeZone: 'UTC',
    }).format(new Date(Date.UTC(year, month - 1, 1)));
  }

  static compactMoney(amount: number, currency = 'ARS'): string {
    return new Intl.NumberFormat(intlLocale(), {
      style: 'currency',
      currency,
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(amount);
  }

  static isoDate(isoDate: string): string {
    const [year, month, day] = isoDate.split('-').map(Number) as [number, number, number];
    return Formats.date(new Date(year, month - 1, day), 'shortDate');
  }

  static money(amount: number, currency = 'ARS'): string {
    return new Intl.NumberFormat(intlLocale(), {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  }
}
