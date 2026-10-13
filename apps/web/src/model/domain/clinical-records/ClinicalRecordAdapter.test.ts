import type { ConsultationDto } from '@mentora/contracts';
import { describe, expect, it } from 'vitest';
import { ClinicalRecordAdapter } from './ClinicalRecordAdapter';
import { ConsultationForm, emptyMedication } from './consultation.form';

describe('ClinicalRecordAdapter (CU-08)', () => {
  it('summarizes consultations for the timeline', () => {
    const [item] = ClinicalRecordAdapter.toTimeline({
      patientId: 'p-1',
      openedAt: '2030-01-01T00:00:00.000Z',
      updatedAt: '2030-01-01T00:00:00.000Z',
      consultations: [
        {
          id: 'c-1',
          date: new Date(2030, 0, 5, 15, 0).toISOString(),
          type: 'virtual',
          reason: 'Insomnia',
          diagnosis: {
            code: 'F51.01',
            name: 'Insomnia disorder',
            assignedAt: '2030-01-05T15:00:00.000Z',
          },
          medicationCount: 1,
        },
      ],
    });

    expect(item).toEqual({
      id: 'c-1',
      dateLabel: '05/01/2030 15:00',
      typeLabel: 'Virtual',
      reason: 'Insomnia',
      diagnosisLabel: 'F51.01 · Insomnia disorder',
      medicationsLabel: '1 medication',
    });
  });

  it('shows placeholders when evolution or diagnosis are missing', () => {
    const consultation: ConsultationDto = {
      id: 'c-2',
      date: '2030-01-05T15:00:00.000Z',
      type: 'in_person',
      reason: 'Control',
      observations: null,
      evolution: null,
      diagnosis: null,
      medications: [
        {
          name: 'Sertraline',
          dose: '50 mg',
          frequency: 'daily',
          duration: '3 months',
          indications: null,
          prescribedAt: '2030-01-05T15:00:00.000Z',
        },
      ],
      recordedAt: '2030-01-05T15:00:00.000Z',
    };

    const detail = ClinicalRecordAdapter.toDetail(consultation);
    expect(detail.evolution).toBe('No evolution recorded');
    expect(detail.diagnosisLabel).toBe('No diagnosis assigned');
    expect(detail.medications[0]?.posology).toBe('50 mg · daily · 3 months');
  });
});

describe('ConsultationForm (CU-09)', () => {
  it('maps the form to the register request', () => {
    const request = ConsultationForm.toRequest({
      ...ConsultationForm.defaults(new Date(2030, 0, 5, 15, 0)),
      reason: ' Anxiety ',
      evolution: '',
      diagnosis: { code: 'F41.1', name: 'GAD' },
      medications: [
        {
          ...emptyMedication,
          name: 'Sertraline',
          dose: '50 mg',
          frequency: 'daily',
          duration: '3m',
        },
      ],
    });

    expect(request).toMatchObject({
      date: new Date(2030, 0, 5, 15, 0).toISOString(),
      reason: 'Anxiety',
      evolution: null,
      diagnosisCode: 'F41.1',
      medications: [{ name: 'Sertraline', indications: null }],
    });
  });
});
