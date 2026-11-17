export type IsoWeekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export abstract class LocalCalendar {
  abstract readonly timezone: string;
  abstract dateOf(instant: Date): string;
  abstract instantOf(date: string, time: string): Date;

  static weekdayOf(date: string): IsoWeekday {
    const day = new Date(`${date}T00:00:00.000Z`).getUTCDay();
    return (day === 0 ? 7 : day) as IsoWeekday;
  }

  static addDays(date: string, days: number): string {
    const base = new Date(`${date}T00:00:00.000Z`);
    base.setUTCDate(base.getUTCDate() + days);
    return base.toISOString().slice(0, 10);
  }
}
