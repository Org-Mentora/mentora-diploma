import type { PatientDto, PatientInputDto } from '@mentora/contracts';
import { z } from 'zod';

/**
 * CU-04 needs only names and DNI; CU-06 edits everything. One form serves both (ADR-0021).
 * Every field is a string in the form; `toInput` converts to the API contract.
 */
export const patientFormSchema = z.object({
  firstName: z.string().trim().min(1, 'Required'),
  lastName: z.string().trim().min(1, 'Required'),
  dni: z
    .string()
    .trim()
    .refine(
      (value) => /^\d{7,8}$/.test(value.replace(/[.\s-]/g, '')),
      'DNI must have 7 or 8 digits',
    ),
  birthDate: z.string(),
  gender: z.string(),
  phone: z.string(),
  email: z.union([z.literal(''), z.email('Enter a valid email')]),
  address: z.string(),
  healthInsurance: z.string(),
  memberNumber: z.string(),
  familyContactName: z.string(),
  familyContactPhone: z.string(),
  debt: z.string().refine((v) => v === '' || Number(v) >= 0, 'Must be zero or more'),
  allergies: z.string().meta({ description: 'Comma separated' }),
  observations: z.string(),
});

export type PatientFormValues = z.infer<typeof patientFormSchema>;

export const emptyPatientForm: PatientFormValues = {
  firstName: '',
  lastName: '',
  dni: '',
  birthDate: '',
  gender: '',
  phone: '',
  email: '',
  address: '',
  healthInsurance: '',
  memberNumber: '',
  familyContactName: '',
  familyContactPhone: '',
  debt: '',
  allergies: '',
  observations: '',
};

const orNull = (value: string) => (value.trim() === '' ? null : value.trim());

export class PatientForm {
  static fromDto(dto: PatientDto): PatientFormValues {
    return {
      firstName: dto.firstName,
      lastName: dto.lastName,
      dni: dto.dni,
      birthDate: dto.birthDate ?? '',
      gender: dto.gender ?? '',
      phone: dto.phone ?? '',
      email: dto.email ?? '',
      address: dto.address ?? '',
      healthInsurance: dto.healthInsurance ?? '',
      memberNumber: dto.memberNumber ?? '',
      familyContactName: dto.familyContact?.name ?? '',
      familyContactPhone: dto.familyContact?.phone ?? '',
      debt: dto.debt ? String(dto.debt) : '',
      allergies: dto.allergies.join(', '),
      observations: dto.observations ?? '',
    };
  }

  static toInput(values: PatientFormValues): PatientInputDto {
    const contactName = values.familyContactName.trim();
    const contactPhone = values.familyContactPhone.trim();
    return {
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      dni: values.dni.replace(/[.\s-]/g, ''),
      birthDate: orNull(values.birthDate),
      gender: orNull(values.gender),
      phone: orNull(values.phone),
      email: orNull(values.email),
      address: orNull(values.address),
      healthInsurance: orNull(values.healthInsurance),
      memberNumber: orNull(values.memberNumber),
      familyContact:
        contactName && contactPhone ? { name: contactName, phone: contactPhone } : null,
      debt: values.debt === '' ? 0 : Number(values.debt),
      allergies: values.allergies
        .split(',')
        .map((allergy) => allergy.trim())
        .filter(Boolean),
      observations: orNull(values.observations),
    };
  }
}
