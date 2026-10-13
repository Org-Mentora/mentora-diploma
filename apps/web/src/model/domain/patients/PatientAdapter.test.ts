import type { PatientDto } from '@mentora/contracts';
import { describe, expect, it } from 'vitest';
import { PatientAdapter } from './PatientAdapter';
import { PatientForm } from './patient.form';

const dto: PatientDto = {
  id: 'p-1',
  firstName: 'Juan',
  lastName: 'Pérez',
  fullName: 'Juan Pérez',
  dni: '30123456',
  birthDate: '1990-06-16',
  age: 39,
  gender: null,
  phone: '+54 11 5555 0000',
  email: null,
  address: null,
  healthInsurance: 'OSDE',
  memberNumber: '123',
  familyContact: { name: 'Ana', phone: '+54 11 1111 1111' },
  debt: 0,
  allergies: ['Penicillin'],
  observations: null,
  status: 'discharged',
  statusChangedAt: '2030-01-01T10:00:00.000Z',
  statusOrigin: 'manual',
  registeredAt: '2029-01-01T10:00:00.000Z',
};

describe('PatientAdapter', () => {
  it('formats the DNI with thousands separators', () => {
    expect(PatientAdapter.formatDni('30123456')).toBe('30.123.456');
    expect(PatientAdapter.formatDni('5123456')).toBe('5.123.456');
  });

  it('builds the profile with labels and placeholders', () => {
    const profile = PatientAdapter.toProfile(dto);

    expect(profile.headline).toBe('DNI 30.123.456 · 39 years');
    expect(profile.statusLabel).toBe('Discharged');
    expect(profile.statusTone).toBe('secondary');
    expect(profile.details).toContainEqual({ label: 'Birth date', value: '16/06/1990' });
    expect(profile.details).toContainEqual({ label: 'Health insurance', value: 'OSDE · #123' });
    expect(profile.details).toContainEqual({ label: 'Email', value: '—' });
    expect(profile.details).toContainEqual({ label: 'Debt', value: 'No debt' });
  });
});

describe('PatientForm', () => {
  it('round-trips a DTO and converts the form to the API contract', () => {
    const values = PatientForm.fromDto(dto);
    expect(values.allergies).toBe('Penicillin');

    const input = PatientForm.toInput({
      ...values,
      dni: '30.123.456',
      allergies: 'Penicillin, latex ,',
      familyContactPhone: '',
      debt: '1500',
      email: '',
    });

    expect(input).toMatchObject({
      dni: '30123456',
      allergies: ['Penicillin', 'latex'],
      familyContact: null,
      debt: 1500,
      email: null,
    });
  });
});
