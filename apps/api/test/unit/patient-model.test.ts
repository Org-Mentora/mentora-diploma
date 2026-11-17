import { describe, expect, it } from 'vitest';
import { ValidationError } from '#core/errors/ApplicationError';
import { Patient, type PatientDetails } from '../../src/modules/patients/model/Patient';
import { PatientSearch } from '../../src/modules/patients/model/PatientSearch';
import { PatientService } from '../../src/modules/patients/model/PatientService';
import { FixedClock, SequentialIds } from '../support/fakes';
import { InMemoryPatientRepository, InMemoryTransactionManager } from '../support/inMemory';

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
    const patient = Patient.register(crypto.randomUUID(), 'prof-1', details(), now);

    expect(patient.status).toBe('active');
    expect(patient.dni).toBe('30123456');
    expect(patient.allergies).toEqual(['penicillin']);
    expect(patient.fullName).toBe('Juan Pérez');
  });

  it('computes the age in whole years (Person base class)', () => {
    expect(Patient.register(crypto.randomUUID(), 'prof-1', details(), now).age(now)).toBe(39);
    expect(
      Patient.register(crypto.randomUUID(), 'prof-1', details({ birthDate: null }), now).age(now),
    ).toBeNull();
  });

  it.each([
    [{ dni: '12' }, 'DNI must have 7 or 8 digits'],
    [{ firstName: '  ' }, 'First and last name are required'],
    [{ debt: -1 }, 'Debt cannot be negative'],
  ])('rejects invalid details %j', (overrides, message) => {
    expect(() => Patient.register(crypto.randomUUID(), 'prof-1', details(overrides), now)).toThrow(
      message,
    );
  });

  it('records manual status changes with date and origin', () => {
    const patient = Patient.register(crypto.randomUUID(), 'prof-1', details(), now);
    patient.changeStatus('discharged', later);

    expect(patient.status).toBe('discharged');
    expect(patient.statusChangedAt).toEqual(later);
    expect(patient.statusOrigin).toBe('manual');
    expect(() => patient.changeStatus('discharged', later)).toThrow(ValidationError);
  });

  it('only the system marks a patient inactive, and it can be reactivated', () => {
    const patient = Patient.register(crypto.randomUUID(), 'prof-1', details(), now);
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

describe('PatientService identity (DIP)', () => {
  it('takes new patient ids from the injected IdGenerator', async () => {
    const service = new PatientService(
      new InMemoryPatientRepository(),
      new InMemoryTransactionManager(),
      new FixedClock(now),
      new SequentialIds('patient'),
    );

    const first = await service.register('prof-1', details());
    const second = await service.register('prof-1', details({ dni: '30.123.457' }));

    expect([first.id, second.id]).toEqual(['patient-1', 'patient-2']);
    expect((await service.get('prof-1', 'patient-2')).dni).toBe('30123457');
  });
});
