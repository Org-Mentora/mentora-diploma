import { describe, expect, it } from 'vitest';
import { ValidationError } from '#core/errors/ApplicationError';
import { MonthRange } from '../../src/modules/appointments/model/EarningsReport';
import { IntlLocalCalendar } from '../../src/modules/booking/infrastructure/IntlLocalCalendar';
import { BookingPage } from '../../src/modules/booking/model/BookingPage';
import { BookingRequest } from '../../src/modules/booking/model/BookingRequest';
import { SlotPlanner } from '../../src/modules/booking/model/SlotPlanner';

const now = new Date('2030-01-01T12:00:00.000Z');

describe('IntlLocalCalendar', () => {
  it('converts wall-clock times of a time zone to instants and back', () => {
    const buenosAires = new IntlLocalCalendar('America/Argentina/Buenos_Aires');
    const madrid = new IntlLocalCalendar('Europe/Madrid');

    expect(buenosAires.instantOf('2030-01-02', '09:00').toISOString()).toBe(
      '2030-01-02T12:00:00.000Z',
    );
    expect(madrid.instantOf('2030-07-01', '09:00').toISOString()).toBe('2030-07-01T07:00:00.000Z');
    expect(buenosAires.dateOf(new Date('2030-01-02T02:00:00.000Z'))).toBe('2030-01-01');
  });
});

describe('BookingPage', () => {
  it('builds a readable slug without accents', () => {
    expect(BookingPage.slugFor('Laura Gómez Núñez', 'AB12cd-ef')).toBe('laura-gomez-nunez-ab12cd');
  });

  it('rejects overlapping ranges and ranges shorter than a slot', () => {
    const page = BookingPage.open('prof', 'laura-abc123', now);
    const base = { ...BookingPage.DEFAULTS, enabled: true };

    expect(() =>
      page.configure(
        {
          ...base,
          weeklyHours: [
            { weekday: 1, start: '09:00', end: '12:00' },
            { weekday: 1, start: '11:00', end: '13:00' },
          ],
        },
        now,
      ),
    ).toThrow(ValidationError);
    expect(() =>
      page.configure({ ...base, weeklyHours: [{ weekday: 2, start: '09:00', end: '09:30' }] }, now),
    ).toThrow(ValidationError);
    expect(() => page.configure({ ...base, weeklyHours: [] }, now)).toThrow(ValidationError);
  });
});

describe('SlotPlanner', () => {
  const planner = new SlotPlanner(new IntlLocalCalendar('America/Argentina/Buenos_Aires'));
  const page = BookingPage.open('prof', 'laura-abc123', now);
  page.configure(
    {
      ...BookingPage.DEFAULTS,
      enabled: true,
      minNoticeHours: 0,
      weeklyHours: [{ weekday: 4, start: '09:00', end: '11:00' }],
    },
    now,
  );

  it('splits office hours into slots and drops busy and past ones', () => {
    const busy = [
      {
        startsAt: new Date('2030-01-03T12:45:00.000Z'),
        endsAt: new Date('2030-01-03T13:15:00.000Z'),
      },
    ];
    const [thursday] = planner.plan(page, now, '2030-01-03', 1, busy);

    expect(thursday?.slots.map((s) => s.toISOString())).toEqual(['2030-01-03T12:00:00.000Z']);
    expect(planner.plan(page, now, '2030-01-04', 1, [])[0]?.slots).toEqual([]);
  });
});

describe('BookingRequest', () => {
  const data = {
    requester: {
      firstName: 'Lucas',
      lastName: 'Ibarra',
      dni: '40.111.222',
      birthDate: null,
      phone: null,
      email: null,
    },
    startsAt: new Date('2030-01-03T12:00:00.000Z'),
    durationMinutes: 45,
    modality: 'in_person' as const,
    reason: null,
  };

  it('needs a phone or an email to reach the patient', () => {
    expect(() => BookingRequest.submit('r1', 'prof', data, now)).toThrow(ValidationError);
  });

  it('can be decided once and expires when its time passes', () => {
    const request = BookingRequest.submit(
      'r1',
      'prof',
      { ...data, requester: { ...data.requester, phone: '1155550000' } },
      now,
    );

    expect(request.requester.dni).toBe('40111222');
    expect(request.expireIfPast(new Date('2030-01-03T12:00:00.000Z'))).toBe(true);
    expect(() => request.reject(null, now)).toThrow('already expired');
  });
});

describe('MonthRange', () => {
  it('lists the months of a range across years and limits it to 24', () => {
    expect(MonthRange.of('2029-11', '2030-02').months).toEqual([
      '2029-11',
      '2029-12',
      '2030-01',
      '2030-02',
    ]);
    expect(() => MonthRange.of('2030-01', '2032-02')).toThrow(ValidationError);
    expect(() => MonthRange.of('2030-03', '2030-01')).toThrow(ValidationError);
  });
});
