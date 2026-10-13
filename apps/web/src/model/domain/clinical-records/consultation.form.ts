import type { RegisterConsultationRequestDto } from '@mentora/contracts';
import { format } from 'date-fns';
import { z } from 'zod';

const medicationSchema = z.object({
  name: z.string().trim().min(1, 'Required'),
  dose: z.string().trim().min(1, 'Required'),
  frequency: z.string().trim().min(1, 'Required'),
  duration: z.string().trim().min(1, 'Required'),
  indications: z.string(),
});

/** CU-09 form: evolution, diagnosis (CU-11) and medications (CU-12) are optional. */
export const consultationFormSchema = z.object({
  date: z.string().min(1, 'Required'),
  type: z.enum(['in_person', 'virtual']),
  reason: z.string().trim().min(1, 'Required'),
  observations: z.string(),
  evolution: z.string(),
  diagnosis: z.object({ code: z.string(), name: z.string() }).nullable(),
  medications: z.array(medicationSchema),
});

export type ConsultationFormValues = z.infer<typeof consultationFormSchema>;
export type MedicationFormValues = z.infer<typeof medicationSchema>;

export const emptyMedication: MedicationFormValues = {
  name: '',
  dose: '',
  frequency: '',
  duration: '',
  indications: '',
};

const orNull = (value: string) => (value.trim() === '' ? null : value.trim());

export class ConsultationForm {
  static defaults(now: Date): ConsultationFormValues {
    return {
      date: format(now, "yyyy-MM-dd'T'HH:mm"),
      type: 'in_person',
      reason: '',
      observations: '',
      evolution: '',
      diagnosis: null,
      medications: [],
    };
  }

  /** `date` comes from a local `datetime-local` input. */
  static toRequest(values: ConsultationFormValues): RegisterConsultationRequestDto {
    return {
      date: new Date(values.date).toISOString(),
      type: values.type,
      reason: values.reason.trim(),
      observations: orNull(values.observations),
      evolution: orNull(values.evolution),
      diagnosisCode: values.diagnosis?.code ?? null,
      medications: values.medications.map((m) => ({
        name: m.name.trim(),
        dose: m.dose.trim(),
        frequency: m.frequency.trim(),
        duration: m.duration.trim(),
        indications: orNull(m.indications),
      })),
    };
  }
}
