export abstract class DateFormatter {
  abstract date(value: Date): string;
  abstract time(value: Date): string;

  dateTime(value: Date): string {
    return `${this.date(value)} at ${this.time(value)}`;
  }
}
