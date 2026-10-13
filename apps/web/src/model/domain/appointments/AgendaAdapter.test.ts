import type { AppointmentDto } from '@mentora/contracts';
import { describe, expect, it } from 'vitest';
import { AgendaAdapter } from './AgendaAdapter';
import { AppointmentForm } from './appointment.form';

function appointment(start: Date, overrides: Partial<AppointmentDto> = {}): AppointmentDto {
  return {
    id: start.toISOString(),
    patientId: 'p-1',
    patientName: 'Tomás Silva',
    startsAt: start.toISOString(),
    endsAt: new Date(start.getTime() + 45 * 60_000).toISOString(),
    durationMinutes: 45,
    type: 'control',
    modality: 'in_person',
    status: 'scheduled',
    notes: null,
    cancelledAt: null,
    ...overrides,
  };
}

// Local dates, so the tests do not depend on the machine time zone.
const january = new Date(2030, 0, 1);
const tenth = new Date(2030, 0, 10);
const appointments = [
  appointment(new Date(2030, 0, 10, 15, 0)),
  appointment(new Date(2030, 0, 10, 9, 30), { type: 'first_visit', modality: 'virtual' }),
  appointment(new Date(2030, 0, 10, 11, 0), { status: 'cancelled' }),
];

describe('AgendaAdapter (CU-10)', () => {
  it('builds whole Monday-first weeks for the month grid', () => {
    const weeks = AgendaAdapter.calendar(january, appointments, tenth, tenth);
    const days = weeks.flat();

    expect(weeks.every((week) => week.length === 7)).toBe(true);
    expect(days[0]?.date.getDay()).toBe(1);
    expect(days.find((d) => d.key === '2030-01-10')).toMatchObject({
      appointmentCount: 2, // the cancelled one does not count
      isSelected: true,
      isToday: true,
      inMonth: true,
    });
    expect(days[0]?.inMonth).toBe(false);
  });

  it('lists the day agenda chronologically with labels', () => {
    const items = AgendaAdapter.dayAgenda(appointments, tenth);

    expect(items.map((i) => i.timeRange)).toEqual([
      '09:30 – 10:15',
      '11:00 – 11:45',
      '15:00 – 15:45',
    ]);
    expect(items[0]).toMatchObject({ typeLabel: 'First visit', modalityLabel: 'Virtual' });
    expect(items[1]?.isCancelled).toBe(true);
  });

  it('the range covers the visible grid', () => {
    const { from, to } = AgendaAdapter.monthRange(january);
    expect(from).toEqual(new Date(2029, 11, 31));
    expect(to).toEqual(new Date(2030, 1, 4));
  });
});

describe('AppointmentForm', () => {
  it('converts local date and time to the API contract', () => {
    const request = AppointmentForm.toSchedule({
      ...AppointmentForm.defaults(tenth),
      patientId: 'p-1',
      time: '14:30',
      durationMinutes: '60',
      notes: '  ',
    });

    expect(request).toEqual({
      patientId: 'p-1',
      startsAt: new Date(2030, 0, 10, 14, 30).toISOString(),
      durationMinutes: 60,
      type: 'control',
      modality: 'in_person',
      notes: null,
    });
  });
});
