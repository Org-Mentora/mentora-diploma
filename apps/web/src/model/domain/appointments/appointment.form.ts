import type {
  AppointmentDto,
  RescheduleAppointmentRequestDto,
  ScheduleAppointmentRequestDto,
} from '@mentora/contracts';
import { format } from 'date-fns';
import { z } from 'zod';

export const appointmentFormSchema = z.object({
  patientId: z.string().min(1, 'Select a patient'),
  date: z.string().min(1, 'Required'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Required'),
  durationMinutes: z
    .string()
    .refine((v) => Number(v) >= 10 && Number(v) <= 240, 'Between 10 and 240 minutes'),
  type: z.enum(['first_visit', 'control', 'follow_up', 'medication', 'other']),
  modality: z.enum(['in_person', 'virtual']),
  notes: z.string(),
});

export type AppointmentFormValues = z.infer<typeof appointmentFormSchema>;

export class AppointmentForm {
  static defaults(day: Date): AppointmentFormValues {
    return {
      patientId: '',
      date: format(day, 'yyyy-MM-dd'),
      time: '09:00',
      durationMinutes: '45',
      type: 'control',
      modality: 'in_person',
      notes: '',
    };
  }

  static fromDto(dto: AppointmentDto): AppointmentFormValues {
    const startsAt = new Date(dto.startsAt);
    return {
      patientId: dto.patientId,
      date: format(startsAt, 'yyyy-MM-dd'),
      time: format(startsAt, 'HH:mm'),
      durationMinutes: String(dto.durationMinutes),
      type: dto.type,
      modality: dto.modality,
      notes: dto.notes ?? '',
    };
  }

  static toReschedule(values: AppointmentFormValues): RescheduleAppointmentRequestDto {
    return {
      startsAt: new Date(`${values.date}T${values.time}`).toISOString(),
      durationMinutes: Number(values.durationMinutes),
      type: values.type,
      modality: values.modality,
      notes: values.notes.trim() || null,
    };
  }

  static toSchedule(values: AppointmentFormValues): ScheduleAppointmentRequestDto {
    return { patientId: values.patientId, ...AppointmentForm.toReschedule(values) };
  }
}
