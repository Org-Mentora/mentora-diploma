import type { BookingRequestDto, BookingSettingsDto } from '@mentora/contracts';
import { describe, expect, it } from 'vitest';
import { BookingAdapter } from './BookingAdapter';
import { BookingSettingsForm } from './booking.form';
import { PublicBookingForm, publicBookingSchema } from './publicBooking.form';

const request: BookingRequestDto = {
  id: 'r-1',
  requester: {
    firstName: 'Ana',
    lastName: 'Díaz',
    dni: '30123456',
    birthDate: null,
    phone: '+5491100000000',
    email: null,
  },
  existingPatientId: null,
  startsAt: '2030-01-10T12:00:00.000Z',
  endsAt: '2030-01-10T12:45:00.000Z',
  durationMinutes: 45,
  modality: 'in_person',
  reason: 'Control',
  status: 'pending',
  appointmentId: null,
  rejectionReason: null,
  createdAt: '2030-01-05T12:00:00.000Z',
  decidedAt: null,
};

describe('BookingAdapter (patient online booking)', () => {
  it('describes a pending request in the professional timezone', () => {
    const item = BookingAdapter.toRequestItem(request, 'America/Argentina/Buenos_Aires');
    expect(item).toMatchObject({
      requesterName: 'Ana Díaz',
      dniLabel: 'DNI 30.123.456',
      isNewPatient: true,
      isPending: true,
      modalityLabel: 'In person',
    });
    expect(item.when).toContain('09:00');
  });

  it('shows slot times in the page timezone', () => {
    const [day] = BookingAdapter.toSlotDays({
      timezone: 'America/Argentina/Buenos_Aires',
      days: [{ date: '2030-01-10', slots: ['2030-01-10T12:00:00.000Z'] }],
    });
    expect(day?.slots[0]?.label).toBe('09:00');
  });

  it('round-trips the weekly hours of the settings form', () => {
    const dto: BookingSettingsDto = {
      slug: 'ana-diaz-ab12cd',
      timezone: 'UTC',
      enabled: true,
      slotMinutes: 30,
      minNoticeHours: 12,
      horizonDays: 30,
      modalities: ['virtual'],
      weeklyHours: [
        { weekday: 3, start: '14:00', end: '18:00' },
        { weekday: 1, start: '09:00', end: '13:00' },
      ],
      instructions: null,
    };
    const values = BookingSettingsForm.fromDto(dto);
    expect(values.weeklyHours[0]).toEqual({ weekday: '1', start: '09:00', end: '13:00' });
    expect(BookingSettingsForm.toRequest(values)).toMatchObject({
      modalities: ['virtual'],
      weeklyHours: [
        { weekday: 1, start: '09:00', end: '13:00' },
        { weekday: 3, start: '14:00', end: '18:00' },
      ],
      instructions: null,
    });
  });

  it('requires a phone or an email from the patient', () => {
    const values = {
      ...PublicBookingForm.defaults('in_person'),
      firstName: 'A',
      lastName: 'B',
      dni: '30123456',
    };
    expect(publicBookingSchema.safeParse(values).success).toBe(false);
    expect(publicBookingSchema.safeParse({ ...values, email: 'a@b.co' }).success).toBe(true);
  });
});
