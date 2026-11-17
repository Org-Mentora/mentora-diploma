import type { PatientDto, SessionDto } from '@mentora/contracts';
import { describe, expect, it } from 'vitest';
import { NotificationAdapter } from '../notifications/NotificationAdapter';
import { PrescriptionBuilder } from './Prescription';
import { PrescriptionPdfAdapter } from './PrescriptionPdfAdapter';

const session: SessionDto = {
  professional: {
    id: 'p',
    firstName: 'Ana',
    lastName: 'García',
    fullName: 'Ana García',
    email: 'ana@mentora.test',
    phone: '+54 11 5555 0000',
    specialty: 'Psychiatry',
    licenseNumber: 'MN-123',
    offices: ['Av. Santa Fe 1000, CABA'],
    hasLogo: false,
  },
  subscription: {
    status: 'trial',
    hasAccess: true,
    accessEndsAt: '2030-01-15T00:00:00.000Z',
    daysLeft: 14,
  },
};

const patient = {
  fullName: 'Lucía Paz',
  dni: '30123456',
  healthInsurance: 'OSDE',
  memberNumber: '99',
} as PatientDto;

describe('Prescription (CU-13)', () => {
  it('builds the letterhead from the session and falls back to the default logo', () => {
    const letterhead = PrescriptionBuilder.letterhead(session, { dataUrl: null });
    expect(letterhead).toMatchObject({
      professionalName: 'Ana García',
      license: 'License MN-123',
      contact: 'ana@mentora.test · +54 11 5555 0000',
      logoDataUrl: null,
      initials: 'AG',
    });

    const prescription = PrescriptionBuilder.build(
      letterhead,
      patient,
      '  Sertraline 50 mg\nOnce a day  ',
      new Date(2030, 0, 5),
    );
    expect(prescription).toMatchObject({
      patientDetail: 'DNI 30.123.456 · OSDE #99',
      content: 'Sertraline 50 mg\nOnce a day',
      fileName: 'prescription-lucia-paz-2030-01-05.pdf',
    });
  });

  it('renders an A4 PDF with the letterhead, the patient and the text', () => {
    const letterhead = PrescriptionBuilder.letterhead(session, { dataUrl: null });
    const prescription = PrescriptionBuilder.build(
      letterhead,
      patient,
      'Sertraline 50 mg',
      new Date(),
    );
    const pdf = PrescriptionPdfAdapter.render(prescription);
    const source = pdf.output();

    expect(pdf.getNumberOfPages()).toBe(1);
    expect(source).toContain('(Ana Garc');
    expect(source).toContain('(Rp/)');
    expect(source).toContain('(Sertraline 50 mg)');
  });
});

describe('NotificationAdapter (CU-14)', () => {
  it('labels the topic and explains failed deliveries', () => {
    const item = NotificationAdapter.toItem({
      id: 'n',
      patientId: 'x',
      channel: 'whatsapp',
      topic: 'appointment_reminder',
      recipient: '1155550000',
      body: 'Reminder…',
      status: 'failed',
      attempts: 2,
      error: 'provider error',
      createdAt: '2030-01-04T15:00:00.000Z',
    });
    expect(item).toMatchObject({
      topicLabel: 'Reminder',
      statusLabel: 'Failed',
      detail: 'provider error (2 attempts)',
    });
  });
});
