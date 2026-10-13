import { z } from 'zod';
import { ErrorResponseSchema } from '#core/contracts/ErrorResponse';
import { nullableRef } from '#core/contracts/nullableRef';
import type { ContractRegistry } from '#core/module/ContractRegistry';

const ConsultationTypeSchema = z.enum(['in_person', 'virtual']);

export const MedicationSchema = z
  .object({
    name: z.string(),
    dose: z.string(),
    frequency: z.string(),
    duration: z.string(),
    indications: z.string().nullable(),
    prescribedAt: z.iso.datetime(),
  })
  .meta({ id: 'MedicationDto' });

export const AssignedDiagnosisSchema = z
  .object({
    code: z.string().meta({ example: 'F41.1' }),
    name: z.string(),
    assignedAt: z.iso.datetime(),
  })
  .meta({ id: 'AssignedDiagnosisDto' });

export const ConsultationSchema = z
  .object({
    id: z.uuid(),
    date: z.iso.datetime(),
    type: ConsultationTypeSchema,
    reason: z.string(),
    observations: z.string().nullable(),
    evolution: z.string().nullable(),
    diagnosis: nullableRef(AssignedDiagnosisSchema),
    medications: z.array(MedicationSchema),
    recordedAt: z.iso.datetime(),
  })
  .meta({ id: 'ConsultationDto', description: 'Full detail of a consultation (CU-08 step 6)' });

export const ConsultationSummarySchema = z
  .object({
    id: z.uuid(),
    date: z.iso.datetime(),
    type: ConsultationTypeSchema,
    reason: z.string(),
    diagnosis: nullableRef(AssignedDiagnosisSchema),
    medicationCount: z.number().int(),
  })
  .meta({ id: 'ConsultationSummaryDto' });

export const ClinicalRecordSchema = z
  .object({
    patientId: z.uuid(),
    openedAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
    consultations: z.array(ConsultationSummarySchema),
  })
  .meta({ id: 'ClinicalRecordDto', description: 'Consultations newest first (CU-08)' });

export const DiagnosisHistoryEntrySchema = z
  .object({
    consultationId: z.uuid(),
    consultationDate: z.iso.datetime(),
    diagnosis: AssignedDiagnosisSchema,
  })
  .meta({ id: 'DiagnosisHistoryEntryDto' });

export const MedicationInputSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    dose: z.string().trim().min(1).max(60),
    frequency: z.string().trim().min(1).max(80),
    duration: z.string().trim().min(1).max(80),
    indications: z.string().trim().max(500).nullable().optional(),
  })
  .meta({ id: 'MedicationInputDto' });

export const RegisterConsultationRequestSchema = z
  .object({
    date: z.iso.datetime(),
    type: ConsultationTypeSchema,
    reason: z.string().trim().min(1).max(500),
    observations: z.string().trim().max(4000).nullable().optional(),
    evolution: z.string().trim().max(8000).nullable().optional(),
    diagnosisCode: z.string().trim().max(10).nullable().optional(),
    medications: z.array(MedicationInputSchema).max(20).optional(),
  })
  .meta({ id: 'RegisterConsultationRequestDto' });

export const PatientRecordParamsSchema = z.object({ patientId: z.uuid() });
export const ConsultationParamsSchema = z.object({
  patientId: z.uuid(),
  consultationId: z.uuid(),
});

export type ConsultationDto = z.infer<typeof ConsultationSchema>;
export type ConsultationSummaryDto = z.infer<typeof ConsultationSummarySchema>;
export type ClinicalRecordDto = z.infer<typeof ClinicalRecordSchema>;
export type DiagnosisHistoryEntryDto = z.infer<typeof DiagnosisHistoryEntrySchema>;
export type RegisterConsultationRequestDto = z.infer<typeof RegisterConsultationRequestSchema>;

export function registerClinicalRecordContracts(registry: ContractRegistry): void {
  const tags = ['ClinicalRecords'];
  const notFound = {
    description: 'Patient or consultation not found',
    schema: ErrorResponseSchema,
  };

  registry.registerRoute({
    method: 'get',
    path: '/patients/{patientId}/clinical-record',
    operationId: 'getClinicalRecord',
    summary: 'CU-08 Clinical record of a patient (consultations newest first)',
    tags,
    auth: true,
    request: { params: PatientRecordParamsSchema },
    responses: {
      200: { description: 'Clinical record', schema: ClinicalRecordSchema },
      404: notFound,
    },
  });
  registry.registerRoute({
    method: 'post',
    path: '/patients/{patientId}/clinical-record/consultations',
    operationId: 'registerConsultation',
    summary:
      'CU-09 Register a consultation with evolution, diagnosis (CU-11) and medication (CU-12)',
    tags,
    auth: true,
    request: { params: PatientRecordParamsSchema, body: RegisterConsultationRequestSchema },
    responses: {
      201: { description: 'Consultation registered', schema: ConsultationSchema },
      400: { description: 'Invalid data or unknown diagnosis code', schema: ErrorResponseSchema },
      404: notFound,
    },
  });
  registry.registerRoute({
    method: 'get',
    path: '/patients/{patientId}/clinical-record/consultations/{consultationId}',
    operationId: 'getConsultation',
    summary: 'CU-08 Detail of one consultation',
    tags,
    auth: true,
    request: { params: ConsultationParamsSchema },
    responses: { 200: { description: 'Consultation', schema: ConsultationSchema }, 404: notFound },
  });
  registry.registerRoute({
    method: 'get',
    path: '/patients/{patientId}/clinical-record/diagnoses',
    operationId: 'getDiagnosisHistory',
    summary: 'CU-11 Diagnosis history of a patient (newest first)',
    tags,
    auth: true,
    request: { params: PatientRecordParamsSchema },
    responses: {
      200: { description: 'Diagnosis history', schema: z.array(DiagnosisHistoryEntrySchema) },
      404: notFound,
    },
  });
}
