import { z } from 'zod';
import { ErrorResponseSchema } from '#core/contracts/ErrorResponse';
import { nullableRef } from '#core/contracts/nullableRef';
import type { ContractRegistry } from '#core/module/ContractRegistry';

export const PatientStatusSchema = z.enum(['active', 'discharged', 'inactive']);

export const FamilyContactSchema = z
  .object({ name: z.string().trim().min(1).max(120), phone: z.string().trim().min(1).max(30) })
  .meta({ id: 'FamilyContactDto' });

export const PatientSchema = z
  .object({
    id: z.uuid(),
    firstName: z.string(),
    lastName: z.string(),
    fullName: z.string(),
    dni: z.string(),
    birthDate: z.iso.date().nullable(),
    age: z.number().int().nullable(),
    gender: z.string().nullable(),
    phone: z.string().nullable(),
    email: z.string().nullable(),
    address: z.string().nullable(),
    healthInsurance: z.string().nullable(),
    memberNumber: z.string().nullable(),
    familyContact: nullableRef(FamilyContactSchema),
    debt: z.number(),
    allergies: z.array(z.string()),
    observations: z.string().nullable(),
    status: PatientStatusSchema,
    statusChangedAt: z.iso.datetime(),
    statusOrigin: z.enum(['manual', 'automatic']),
    registeredAt: z.iso.datetime(),
  })
  .meta({ id: 'PatientDto' });

export const PatientSummarySchema = z
  .object({
    id: z.uuid(),
    fullName: z.string(),
    dni: z.string(),
    age: z.number().int().nullable(),
    phone: z.string().nullable(),
    healthInsurance: z.string().nullable(),
    status: PatientStatusSchema,
  })
  .meta({ id: 'PatientSummaryDto' });

const optionalText = (max: number) => z.string().trim().max(max).nullable().optional();

/** Body of CU-04 (create: only names and DNI are required) and CU-06 (update). */
export const PatientInputSchema = z
  .object({
    firstName: z.string().trim().min(1).max(80),
    lastName: z.string().trim().min(1).max(80),
    dni: z.string().trim().min(7).max(12).meta({ example: '30123456' }),
    birthDate: z.iso.date().nullable().optional(),
    gender: optionalText(40),
    phone: optionalText(30),
    email: z.email().nullable().optional(),
    address: optionalText(200),
    healthInsurance: optionalText(120),
    memberNumber: optionalText(60),
    familyContact: nullableRef(FamilyContactSchema).optional(),
    debt: z.number().min(0).optional(),
    allergies: z.array(z.string().trim().min(1).max(80)).max(50).optional(),
    observations: optionalText(2000),
  })
  .meta({ id: 'PatientInputDto' });

export const ChangePatientStatusSchema = z
  .object({ status: z.enum(['active', 'discharged']) })
  .meta({ id: 'ChangePatientStatusRequestDto' });

export const PatientIdParamsSchema = z.object({ id: z.uuid() });
export const SearchPatientsQuerySchema = z.object({
  q: z.string().trim().max(100).optional().meta({ description: 'Name, surname or DNI' }),
});

export type PatientDto = z.infer<typeof PatientSchema>;
export type PatientSummaryDto = z.infer<typeof PatientSummarySchema>;
export type PatientInputDto = z.infer<typeof PatientInputSchema>;
export type ChangePatientStatusDto = z.infer<typeof ChangePatientStatusSchema>;

export function registerPatientContracts(registry: ContractRegistry): void {
  const tags = ['Patients'];
  const notFound = { description: 'Patient not found', schema: ErrorResponseSchema };
  const invalid = { description: 'Invalid data', schema: ErrorResponseSchema };

  registry.registerRoute({
    method: 'post',
    path: '/patients',
    operationId: 'createPatient',
    summary: 'CU-04 Register a patient',
    tags,
    auth: true,
    request: { body: PatientInputSchema },
    responses: {
      201: { description: 'Patient registered', schema: PatientSchema },
      400: invalid,
      409: { description: 'DNI already registered', schema: ErrorResponseSchema },
    },
  });
  registry.registerRoute({
    method: 'get',
    path: '/patients',
    operationId: 'searchPatients',
    summary: 'CU-05 Search patients by name, surname or DNI (all when q is empty)',
    tags,
    auth: true,
    request: { query: SearchPatientsQuerySchema },
    responses: { 200: { description: 'Matching patients', schema: z.array(PatientSummarySchema) } },
  });
  registry.registerRoute({
    method: 'get',
    path: '/patients/{id}',
    operationId: 'getPatient',
    summary: 'Patient profile',
    tags,
    auth: true,
    request: { params: PatientIdParamsSchema },
    responses: { 200: { description: 'Patient', schema: PatientSchema }, 404: notFound },
  });
  registry.registerRoute({
    method: 'put',
    path: '/patients/{id}',
    operationId: 'updatePatient',
    summary: 'CU-06 Update patient data',
    tags,
    auth: true,
    request: { params: PatientIdParamsSchema, body: PatientInputSchema },
    responses: {
      200: { description: 'Patient updated', schema: PatientSchema },
      400: invalid,
      404: notFound,
      409: { description: 'DNI already registered', schema: ErrorResponseSchema },
    },
  });
  registry.registerRoute({
    method: 'patch',
    path: '/patients/{id}/status',
    operationId: 'changePatientStatus',
    summary: 'CU-07 Discharge or reactivate a patient',
    tags,
    auth: true,
    request: { params: PatientIdParamsSchema, body: ChangePatientStatusSchema },
    responses: {
      200: { description: 'Status changed', schema: PatientSchema },
      400: invalid,
      404: notFound,
    },
  });
}
