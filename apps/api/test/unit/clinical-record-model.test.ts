import { describe, expect, it } from 'vitest';
import { AssignedDiagnosis } from '../../src/modules/clinical-records/model/AssignedDiagnosis';
import { ClinicalRecord } from '../../src/modules/clinical-records/model/ClinicalRecord';
import {
  Consultation,
  type NewConsultation,
} from '../../src/modules/clinical-records/model/Consultation';
import { Medication } from '../../src/modules/clinical-records/model/Medication';

const at = (iso: string) => new Date(iso);

function consultation(date: string, diagnosis: AssignedDiagnosis | null): Consultation {
  const data: NewConsultation = {
    date: at(date),
    type: 'in_person',
    reason: 'Follow-up',
    observations: null,
    evolution: '  Better sleep  ',
    diagnosis,
    medications: [],
  };
  return Consultation.record(data, at(date));
}

describe('ClinicalRecord aggregate (CU-08, CU-09, CU-11)', () => {
  it('lists consultations newest first and keeps every diagnosis in the history', () => {
    const record = ClinicalRecord.open('prof', 'patient', at('2030-01-01T00:00:00Z'));
    const anxiety = AssignedDiagnosis.assign('F41.1', 'GAD', at('2030-01-10T00:00:00Z'));
    const depression = AssignedDiagnosis.assign('F32.1', 'MDD', at('2030-03-10T00:00:00Z'));

    record.addConsultation(
      consultation('2030-01-10T10:00:00Z', anxiety),
      at('2030-01-10T10:00:00Z'),
    );
    record.addConsultation(
      consultation('2030-03-10T10:00:00Z', depression),
      at('2030-03-10T10:00:00Z'),
    );
    record.addConsultation(consultation('2030-02-10T10:00:00Z', null), at('2030-02-10T10:00:00Z'));

    expect(record.consultationsChronological().map((c) => c.date.getUTCMonth())).toEqual([2, 1, 0]);
    expect(record.diagnosisHistory().map((h) => h.diagnosis.code)).toEqual(['F32.1', 'F41.1']);
    expect(record.updatedAt).toEqual(at('2030-02-10T10:00:00Z'));
  });

  it('trims the evolution note and requires a reason', () => {
    expect(consultation('2030-01-10T10:00:00Z', null).evolution).toBe('Better sleep');
    expect(() =>
      Consultation.record(
        {
          date: at('2030-01-10T10:00:00Z'),
          type: 'virtual',
          reason: ' ',
          observations: null,
          evolution: null,
          diagnosis: null,
          medications: [],
        },
        at('2030-01-10T10:00:00Z'),
      ),
    ).toThrow('reason is required');
  });
});

describe('Medication (CU-12)', () => {
  it('requires name, dose, frequency and duration', () => {
    const data = { name: 'Sertraline', dose: '50 mg', frequency: 'daily', duration: '3 months' };

    expect(
      Medication.prescribe({ ...data, indications: ' ' }, at('2030-01-01T00:00:00Z')).indications,
    ).toBeNull();
    expect(() =>
      Medication.prescribe({ ...data, dose: '', indications: null }, at('2030-01-01T00:00:00Z')),
    ).toThrow('Medication dose is required');
  });
});
