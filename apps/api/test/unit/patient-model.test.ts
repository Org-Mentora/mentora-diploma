import { describe, expect, it } from 'vitest';
import { ValidationError } from '#core/errors/ApplicationError';
import { Patient, type PatientDetails } from '../../src/modules/patients/model/Patient';
import { PatientSearch } from '../../src/modules/patients/model/PatientSearch';

const now = new Date('2030-06-15T10:00:00.000Z');
const later = new Date('2030-06-20T10:00:00.000Z');

function details(overrides: Partial<PatientDetails> = {}): PatientDetails {
  return {
    firstName: 'Juan',
    lastName: 'Pérez',
    dni: '30.123.456',
    birthDate: new Date('1990-06-16T00:00:00.000Z'),
    gender: null,
    phone: null,
    email: null,
    address: null,
    healthInsurance: null,
    memberNumber: null,
    familyContact: null,
    debt: 0,
    allergies: [' penicillin ', 'penicillin', ''],
    observations: null,
    ...overrides,
  };
}

describe('Patient (CU-04, CU-06, CU-07)', () => {
  it('registers as active, normalizing DNI and allergies', () => {
    const patient = Patient.register('prof-1', details(), now);

    expect(patient.status).toBe('active');
    expect(patient.dni).toBe('30123456');
    expect(patient.allergies).toEqual(['penicillin']);
    expect(patient.fullName).toBe('Juan Pérez');
  });

  it('computes the age in whole years (Person base class)', () => {
    expect(Patient.register('prof-1', details(), now).age(now)).toBe(39);
    expect(Patient.register('prof-1', details({ birthDate: null }), now).age(now)).toBeNull();
  });

  it.each([
    [{ dni: '12' }, 'DNI must have 7 or 8 digits'],
    [{ firstName: '  ' }, 'First and last name are required'],
    [{ debt: -1 }, 'Debt cannot be negative'],
  ])('rejects invalid details %j', (overrides, message) => {
    expect(() => Patient.register('prof-1', details(overrides), now)).toThrow(message);
  });

  it('records manual status changes with date and origin', () => {
    const patient = Patient.register('prof-1', details(), now);
    patient.changeStatus('discharged', later);

    expect(patient.status).toBe('discharged');
    expect(patient.statusChangedAt).toEqual(later);
    expect(patient.statusOrigin).toBe('manual');
    expect(() => patient.changeStatus('discharged', later)).toThrow(ValidationError);
  });

  it('only the system marks a patient inactive, and it can be reactivated', () => {
    const patient = Patient.register('prof-1', details(), now);
    patient.markInactive(later);

    expect(patient.status).toBe('inactive');
    expect(patient.statusOrigin).toBe('automatic');
    patient.changeStatus('active', later);
    expect(patient.status).toBe('active');
  });
});

describe('PatientSearch (CU-05)', () => {
  it('normalizes accents and case so "perez" finds "Pérez"', () => {
    expect(PatientSearch.terms('  JUAN   Pérez ')).toEqual(['juan', 'perez']);
    expect(PatientSearch.indexText('Juan', 'Pérez', '30123456')).toBe('juan perez 30123456');
    expect(PatientSearch.terms(undefined)).toEqual([]);
  });
});
