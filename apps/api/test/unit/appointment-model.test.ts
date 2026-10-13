import { describe, expect, it } from 'vitest';
import { ConflictError, ValidationError } from '#core/errors/ApplicationError';
import {
  Appointment,
  type AppointmentSlot,
} from '../../src/modules/appointments/model/Appointment';

const now = new Date('2030-01-01T08:00:00.000Z');

function slot(startsAt: string, durationMinutes = 45): AppointmentSlot {
  return {
    startsAt: new Date(startsAt),
    durationMinutes,
    type: 'control',
    modality: 'in_person',
    notes: null,
  };
}

const schedule = (startsAt: string, duration = 45) =>
  Appointment.schedule('prof', 'patient', slot(startsAt, duration), now);

describe('Appointment (CU-10)', () => {
  it('detects overlapping scheduled appointments', () => {
    const tenOClock = schedule('2030-01-02T10:00:00Z');

    expect(tenOClock.endsAt.toISOString()).toBe('2030-01-02T10:45:00.000Z');
    expect(tenOClock.overlaps(schedule('2030-01-02T10:30:00Z'))).toBe(true);
    expect(tenOClock.overlaps(schedule('2030-01-02T09:30:00Z'))).toBe(true);
    expect(tenOClock.overlaps(schedule('2030-01-02T10:45:00Z'))).toBe(false);
    expect(tenOClock.overlaps(tenOClock)).toBe(false);
  });

  it('cancelled appointments free their slot and cannot change again', () => {
    const appointment = schedule('2030-01-02T10:00:00Z');
    appointment.cancel(now);

    expect(appointment.status).toBe('cancelled');
    expect(appointment.overlaps(schedule('2030-01-02T10:00:00Z'))).toBe(false);
    expect(() => appointment.cancel(now)).toThrow(ConflictError);
    expect(() => appointment.reschedule(slot('2030-01-03T10:00:00Z'), now)).toThrow(ConflictError);
  });

  it.each([
    ['2029-12-31T10:00:00Z', 45, 'in the past'],
    ['2030-01-02T10:00:00Z', 5, 'Duration must be between'],
    ['2030-01-02T10:00:00Z', 300, 'Duration must be between'],
  ])('rejects start %s with duration %i', (startsAt, duration, message) => {
    expect(() => schedule(startsAt, duration)).toThrow(ValidationError);
    expect(() => schedule(startsAt, duration)).toThrow(message);
  });
});
