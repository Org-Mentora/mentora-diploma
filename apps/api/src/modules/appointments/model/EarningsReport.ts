import { ValidationError } from '#core/errors/ApplicationError';
import type { AppointmentType } from './Appointment';

export interface EarningsRow {
  month: string;
  type: AppointmentType;
  held: boolean;
  total: number;
  count: number;
  unpriced: number;
}

export interface TypeEarnings {
  type: AppointmentType;
  earned: number;
  projected: number;
  appointments: number;
}

export interface MonthEarnings {
  month: string;
  earned: number;
  projected: number;
  appointments: number;
  unpriced: number;
  byType: TypeEarnings[];
}

export interface EarningsReport {
  currency: string;
  from: string;
  to: string;
  months: MonthEarnings[];
  totals: { earned: number; projected: number; appointments: number; unpriced: number };
}

const MONTH = /^(\d{4})-(0[1-9]|1[0-2])$/;
const DAY_MS = 24 * 60 * 60 * 1000;

// Value Object
export class MonthRange {
  static readonly MAX_MONTHS = 24;

  private constructor(
    readonly from: string,
    readonly to: string,
    readonly months: string[],
  ) {}

  static of(from: string, to: string): MonthRange {
    const start = MonthRange.parse(from, 'from');
    const end = MonthRange.parse(to, 'to');
    const count = (end.year - start.year) * 12 + (end.month - start.month) + 1;
    if (count < 1) {
      throw new ValidationError('`to` must not be before `from`', { field: 'to' });
    }
    if (count > MonthRange.MAX_MONTHS) {
      throw new ValidationError(`The range cannot exceed ${MonthRange.MAX_MONTHS} months`, {
        field: 'to',
      });
    }
    const months = Array.from({ length: count }, (_, i) => {
      const index = start.month - 1 + i;
      const year = start.year + Math.floor(index / 12);
      return `${year}-${String((index % 12) + 1).padStart(2, '0')}`;
    });
    return new MonthRange(from, to, months);
  }

  get window(): { from: Date; to: Date } {
    const [fy, fm] = this.from.split('-').map(Number) as [number, number];
    const [ty, tm] = this.to.split('-').map(Number) as [number, number];
    return {
      from: new Date(Date.UTC(fy, fm - 1, 1) - DAY_MS),
      to: new Date(Date.UTC(ty, tm, 1) + DAY_MS),
    };
  }

  includes(month: string): boolean {
    return this.months.includes(month);
  }

  private static parse(value: string, field: string): { year: number; month: number } {
    const match = MONTH.exec(value);
    if (!match) {
      throw new ValidationError('Months use the YYYY-MM format', { field });
    }
    return { year: Number(match[1]), month: Number(match[2]) };
  }
}

export class EarningsCalculator {
  static summarize(range: MonthRange, currency: string, rows: EarningsRow[]): EarningsReport {
    const months = range.months.map((month): MonthEarnings => {
      const own = rows.filter((row) => row.month === month);
      const types = [...new Set(own.map((row) => row.type))];
      const byType = types.map((type): TypeEarnings => {
        const ofType = own.filter((row) => row.type === type);
        return {
          type,
          earned: EarningsCalculator.sum(
            ofType.filter((r) => r.held),
            'total',
          ),
          projected: EarningsCalculator.sum(
            ofType.filter((r) => !r.held),
            'total',
          ),
          appointments: EarningsCalculator.sum(ofType, 'count'),
        };
      });
      return {
        month,
        earned: EarningsCalculator.sum(byType, 'earned'),
        projected: EarningsCalculator.sum(byType, 'projected'),
        appointments: EarningsCalculator.sum(byType, 'appointments'),
        unpriced: EarningsCalculator.sum(own, 'unpriced'),
        byType: byType.sort((a, b) => b.earned + b.projected - (a.earned + a.projected)),
      };
    });
    return {
      currency,
      from: range.from,
      to: range.to,
      months,
      totals: {
        earned: EarningsCalculator.sum(months, 'earned'),
        projected: EarningsCalculator.sum(months, 'projected'),
        appointments: EarningsCalculator.sum(months, 'appointments'),
        unpriced: EarningsCalculator.sum(months, 'unpriced'),
      },
    };
  }

  private static sum<T, K extends keyof T>(items: T[], key: K): number {
    return items.reduce((total, item) => total + Number(item[key]), 0);
  }
}
