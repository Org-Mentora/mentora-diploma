import type { CreateBookingRequestDto } from '@mentora/contracts';
import { z } from 'zod';

export const publicBookingSchema = z
  .object({
    firstName: z.string().trim().min(1, 'validation.required'),
    lastName: z.string().trim().min(1, 'validation.required'),
    dni: z.string().refine((v) => /^\d{7,8}$/.test(v.replace(/[.\s-]/g, '')), 'validation.dni'),
    birthDate: z.string(),
    phone: z.string().trim(),
    email: z.union([z.literal(''), z.email('validation.email')]),
    reason: z.string().max(500),
    modality: z.enum(['in_person', 'virtual']),
    website: z.string(),
  })
  .refine((v) => v.phone !== '' || v.email !== '', {
    message: 'validation.contact',
    path: ['phone'],
  });

export type PublicBookingFormValues = z.infer<typeof publicBookingSchema>;

export class PublicBookingForm {
  static defaults(modality: 'in_person' | 'virtual'): PublicBookingFormValues {
    return {
      firstName: '',
      lastName: '',
      dni: '',
      birthDate: '',
      phone: '',
      email: '',
      reason: '',
      modality,
      website: '',
    };
  }

  static toRequest(values: PublicBookingFormValues, startsAt: string): CreateBookingRequestDto {
    return {
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      dni: values.dni,
      birthDate: values.birthDate || null,
      phone: values.phone.trim() || null,
      email: values.email.trim() || null,
      reason: values.reason.trim() || null,
      modality: values.modality,
      startsAt,
      ...(values.website ? { website: values.website } : {}),
    };
  }
}
