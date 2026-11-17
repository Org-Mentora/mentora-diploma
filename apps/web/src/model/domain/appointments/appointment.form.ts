import type {
  AppointmentDto,
  RescheduleAppointmentRequestDto,
  ScheduleAppointmentRequestDto,
} from '@mentora/contracts';
import { format } from 'date-fns';
import { z } from 'zod';

export const appointmentFormSchema = z.object({
  patientId: z.string().min(1, 'validation.selectPatient'),
  date: z.string().min(1, 'validation.required'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'validation.required'),
  durationMinutes: z
    .string()
    .refine((v) => Number(v) >= 10 && Number(v) <= 240, 'validation.duration'),
  type: z.enum(['first_visit', 'control', 'follow_up', 'medication', 'other']),
  modality: z.enum(['in_person', 'virtual']),
  notes: z.string(),
  fee: z.string().refine((v) => v.trim() === '' || Number(v) >= 0, 'validation.fee'),
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
      fee: '',
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
      fee: dto.fee === null ? '' : String(dto.fee),
    };
  }

  static toReschedule(values: AppointmentFormValues): RescheduleAppointmentRequestDto {
    return {
      startsAt: new Date(`${values.date}T${values.time}`).toISOString(),
      durationMinutes: Number(values.durationMinutes),
      type: values.type,
      modality: values.modality,
      notes: values.notes.trim() || null,
      fee: values.fee.trim() === '' ? null : Number(values.fee),
    };
  }

  static toSchedule(values: AppointmentFormValues): ScheduleAppointmentRequestDto {
    const { fee, ...slot } = AppointmentForm.toReschedule(values);
    return { patientId: values.patientId, ...slot, ...(fee === null ? {} : { fee }) };
  }
}
