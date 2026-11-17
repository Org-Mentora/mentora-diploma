import { ValidationError } from '#core/errors/ApplicationError';
import { Entity } from '#core/model/Entity';
import type { IsoWeekday } from './LocalCalendar';

export type BookingModality = 'in_person' | 'virtual';

export interface WeeklyWindow {
  weekday: IsoWeekday;
  start: string;
  end: string;
}

export interface BookingSettings {
  enabled: boolean;
  slotMinutes: number;
  minNoticeHours: number;
  horizonDays: number;
  modalities: BookingModality[];
  weeklyHours: WeeklyWindow[];
  instructions: string | null;
}

export interface BookingPageProps extends BookingSettings {
  slug: string;
  updatedAt: Date;
}

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const MAX_WINDOWS = 21;
const MAX_INSTRUCTIONS = 1000;

const minutesOf = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number) as [number, number];
  return hours * 60 + minutes;
};

// Aggregate Root
export class BookingPage extends Entity<BookingPageProps> {
  static readonly DEFAULTS: BookingSettings = {
    enabled: false,
    slotMinutes: 45,
    minNoticeHours: 12,
    horizonDays: 30,
    modalities: ['in_person', 'virtual'],
    weeklyHours: ([1, 2, 3, 4, 5] as const).flatMap((weekday) => [
      { weekday, start: '09:00', end: '13:00' },
      { weekday, start: '14:00', end: '18:00' },
    ]),
    instructions: null,
  };

  static open(professionalId: string, slug: string, now: Date): BookingPage {
    return new BookingPage(professionalId, { ...BookingPage.DEFAULTS, slug, updatedAt: now });
  }

  static restore(professionalId: string, props: BookingPageProps): BookingPage {
    return new BookingPage(professionalId, props);
  }

  static slugFor(fullName: string, suffix: string): string {
    const base = fullName
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40);
    const tail = suffix
      .replace(/[^a-z0-9]/gi, '')
      .toLowerCase()
      .slice(0, 6);
    return base ? `${base}-${tail}` : tail;
  }

  configure(settings: BookingSettings, now: Date): void {
    this.props = { ...this.props, ...BookingPage.validate(settings), updatedAt: now };
  }

  windowsOn(weekday: IsoWeekday): WeeklyWindow[] {
    return this.props.weeklyHours
      .filter((window) => window.weekday === weekday)
      .sort((a, b) => a.start.localeCompare(b.start));
  }

  allows(modality: BookingModality): boolean {
    return this.props.modalities.includes(modality);
  }

  private static validate(settings: BookingSettings): BookingSettings {
    const { slotMinutes, minNoticeHours, horizonDays } = settings;
    if (!Number.isInteger(slotMinutes) || slotMinutes < 15 || slotMinutes > 240) {
      throw new ValidationError('The slot must last between 15 and 240 minutes', {
        field: 'slotMinutes',
      });
    }
    if (!Number.isInteger(minNoticeHours) || minNoticeHours < 0 || minNoticeHours > 168) {
      throw new ValidationError('The minimum notice must be between 0 and 168 hours', {
        field: 'minNoticeHours',
      });
    }
    if (!Number.isInteger(horizonDays) || horizonDays < 1 || horizonDays > 90) {
      throw new ValidationError('Patients can book between 1 and 90 days ahead', {
        field: 'horizonDays',
      });
    }
    const modalities = [...new Set(settings.modalities)];
    if (modalities.length === 0) {
      throw new ValidationError('Allow at least one modality', { field: 'modalities' });
    }
    if (settings.weeklyHours.length > MAX_WINDOWS) {
      throw new ValidationError(`Use up to ${MAX_WINDOWS} time ranges`, { field: 'weeklyHours' });
    }
    for (const window of settings.weeklyHours) {
      if (!TIME.test(window.start) || !TIME.test(window.end)) {
        throw new ValidationError('Times use the HH:mm format', { field: 'weeklyHours' });
      }
      if (minutesOf(window.end) - minutesOf(window.start) < slotMinutes) {
        throw new ValidationError('Each time range must fit at least one slot', {
          field: 'weeklyHours',
        });
      }
    }
    for (const weekday of [1, 2, 3, 4, 5, 6, 7] as const) {
      const sorted = settings.weeklyHours
        .filter((w) => w.weekday === weekday)
        .sort((a, b) => a.start.localeCompare(b.start));
      for (let i = 1; i < sorted.length; i++) {
        if (minutesOf(sorted[i]?.start ?? '00:00') < minutesOf(sorted[i - 1]?.end ?? '00:00')) {
          throw new ValidationError('Time ranges of the same day cannot overlap', {
            field: 'weeklyHours',
          });
        }
      }
    }
    if (settings.enabled && settings.weeklyHours.length === 0) {
      throw new ValidationError('Add at least one time range before enabling online booking', {
        field: 'weeklyHours',
      });
    }
    const instructions = settings.instructions?.trim() || null;
    if (instructions && instructions.length > MAX_INSTRUCTIONS) {
      throw new ValidationError(`Instructions can have up to ${MAX_INSTRUCTIONS} characters`, {
        field: 'instructions',
      });
    }
    return { ...settings, modalities, instructions };
  }

  get professionalId(): string {
    return this.id;
  }

  get slug(): string {
    return this.props.slug;
  }

  get settings(): BookingSettings {
    const { slug: _slug, updatedAt: _updatedAt, ...settings } = this.props;
    return { ...settings, weeklyHours: [...settings.weeklyHours] };
  }

  get enabled(): boolean {
    return this.props.enabled;
  }

  get slotMinutes(): number {
    return this.props.slotMinutes;
  }

  get minNoticeHours(): number {
    return this.props.minNoticeHours;
  }

  get horizonDays(): number {
    return this.props.horizonDays;
  }

  get modalities(): BookingModality[] {
    return [...this.props.modalities];
  }

  get instructions(): string | null {
    return this.props.instructions;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
