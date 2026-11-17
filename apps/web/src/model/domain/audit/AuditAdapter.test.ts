import type { AuditEventDto } from '@mentora/contracts';
import { describe, expect, it } from 'vitest';
import { AuditAdapter } from './AuditAdapter';

const event: AuditEventDto = {
  id: 'e-1',
  action: 'appointment.scheduled',
  category: 'appointment',
  actor: 'professional',
  targetType: 'appointment',
  targetId: 'a-1',
  details: { patientName: 'Lucía Paz', modality: 'virtual', appointmentId: 'a-1' },
  ip: '10.0.0.1',
  userAgent: 'Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/130.0 Safari/537.36',
  occurredAt: '2030-01-10T12:00:00.000Z',
};

describe('AuditAdapter (user audit trail)', () => {
  it('labels the action, the subject and the request origin', () => {
    expect(AuditAdapter.toItem(event)).toMatchObject({
      title: 'Appointment scheduled',
      categoryLabel: 'Appointments',
      actorLabel: 'By you',
      subject: 'Lucía Paz',
      details: ['Modality: Virtual'],
      origin: '10.0.0.1 · Chrome',
    });
  });

  it('falls back to the raw action and flags failed logins', () => {
    const item = AuditAdapter.toItem({
      ...event,
      action: 'session.login_failed',
      category: 'session',
      details: { email: 'x@y.z' },
      ip: null,
      userAgent: null,
    });
    expect(item).toMatchObject({ tone: 'danger', subject: 'x@y.z', origin: null });
    expect(AuditAdapter.toItem({ ...event, action: 'future.thing' }).title).toBe('future.thing');
  });
});
