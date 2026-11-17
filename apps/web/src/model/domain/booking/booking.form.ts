import type { BookingSettingsDto, UpdateBookingSettingsRequestDto } from '@mentora/contracts';
import { z } from 'zod';

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

const windowSchema = z
  .object({
    weekday: z.string(),
    start: z.string().regex(TIME, 'validation.time'),
    end: z.string().regex(TIME, 'validation.time'),
  })
  .refine((w) => w.end > w.start, { message: 'validation.range', path: ['end'] });

export const bookingSettingsSchema = z.object({
  enabled: z.boolean(),
  slotMinutes: z
    .string()
    .refine((v) => Number(v) >= 15 && Number(v) <= 240, 'booking.validation.slot'),
  minNoticeHours: z
    .string()
    .refine((v) => v !== '' && Number(v) >= 0 && Number(v) <= 168, 'booking.validation.notice'),
  horizonDays: z
    .string()
    .refine((v) => Number(v) >= 1 && Number(v) <= 90, 'booking.validation.horizon'),
  inPerson: z.boolean(),
  virtual: z.boolean(),
  weeklyHours: z.array(windowSchema).max(21),
  instructions: z.string().max(1000),
});

export type BookingSettingsFormValues = z.infer<typeof bookingSettingsSchema>;

export class BookingSettingsForm {
  static readonly EMPTY_WINDOW = { weekday: '1', start: '09:00', end: '13:00' };

  static fromDto(dto: BookingSettingsDto): BookingSettingsFormValues {
    return {
      enabled: dto.enabled,
      slotMinutes: String(dto.slotMinutes),
      minNoticeHours: String(dto.minNoticeHours),
      horizonDays: String(dto.horizonDays),
      inPerson: dto.modalities.includes('in_person'),
      virtual: dto.modalities.includes('virtual'),
      weeklyHours: [...dto.weeklyHours]
        .sort((a, b) => a.weekday - b.weekday || a.start.localeCompare(b.start))
        .map((w) => ({ weekday: String(w.weekday), start: w.start, end: w.end })),
      instructions: dto.instructions ?? '',
    };
  }

  static toRequest(values: BookingSettingsFormValues): UpdateBookingSettingsRequestDto {
    return {
      enabled: values.enabled,
      slotMinutes: Number(values.slotMinutes),
      minNoticeHours: Number(values.minNoticeHours),
      horizonDays: Number(values.horizonDays),
      modalities: [
        ...(values.inPerson ? (['in_person'] as const) : []),
        ...(values.virtual ? (['virtual'] as const) : []),
      ],
      weeklyHours: values.weeklyHours.map((w) => ({
        weekday: Number(w.weekday),
        start: w.start,
        end: w.end,
      })),
      instructions: values.instructions.trim() || null,
    };
  }

  static publicPath(slug: string): string {
    return `/book/${slug}`;
  }
}
