import { z } from 'zod';
import { ErrorResponseSchema } from '#core/contracts/ErrorResponse';
import { PageQuerySchema, pageOf } from '#core/contracts/Pagination';
import type { ContractRegistry } from '#core/module/ContractRegistry';

const AppointmentTypeSchema = z.enum([
  'first_visit',
  'control',
  'follow_up',
  'medication',
  'other',
]);
const AppointmentModalitySchema = z.enum(['in_person', 'virtual']);

export const AppointmentSchema = z
  .object({
    id: z.uuid(),
    patientId: z.uuid(),
    patientName: z.string(),
    startsAt: z.iso.datetime(),
    endsAt: z.iso.datetime(),
    durationMinutes: z.number().int(),
    type: AppointmentTypeSchema,
    modality: AppointmentModalitySchema,
    status: z.enum(['scheduled', 'cancelled']),
    notes: z.string().nullable(),
    fee: z.number().nullable().meta({ description: 'Consultation fee (ARS); null = no fee' }),
    source: z
      .enum(['agenda', 'online'])
      .meta({ description: '`online`: requested by the patient' }),
    cancelledAt: z.iso.datetime().nullable(),
  })
  .meta({ id: 'AppointmentDto' });

const slotShape = {
  startsAt: z.iso.datetime(),
  durationMinutes: z.number().int().min(10).max(240),
  type: AppointmentTypeSchema,
  modality: AppointmentModalitySchema,
  notes: z.string().trim().max(1000).nullable().optional(),
  fee: z.number().min(0).max(100_000_000).nullable().optional().meta({
    description: 'Omit to use the fee configured for the type; null for no fee',
  }),
};

const FeeAmountSchema = z.number().min(0).max(100_000_000).nullable();
const FeeTableSchema = z.object({
  first_visit: FeeAmountSchema,
  control: FeeAmountSchema,
  follow_up: FeeAmountSchema,
  medication: FeeAmountSchema,
  other: FeeAmountSchema,
});

export const ConsultationFeesSchema = z
  .object({ currency: z.string(), amounts: FeeTableSchema, updatedAt: z.iso.datetime() })
  .meta({ id: 'ConsultationFeesDto' });

export const UpdateConsultationFeesRequestSchema = z
  .object({ amounts: FeeTableSchema })
  .meta({ id: 'UpdateConsultationFeesRequestDto' });

const MonthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);

export const EarningsQuerySchema = z.object({
  from: MonthSchema.meta({ description: 'First month (YYYY-MM)' }),
  to: MonthSchema.meta({ description: 'Last month, inclusive (YYYY-MM). Max 24 months' }),
});

export const EarningsReportSchema = z
  .object({
    currency: z.string(),
    from: z.string(),
    to: z.string(),
    months: z.array(
      z.object({
        month: z.string(),
        earned: z.number(),
        projected: z.number(),
        appointments: z.number().int(),
        unpriced: z.number().int(),
        byType: z.array(
          z.object({
            type: AppointmentTypeSchema,
            earned: z.number(),
            projected: z.number(),
            appointments: z.number().int(),
          }),
        ),
      }),
    ),
    totals: z.object({
      earned: z.number(),
      projected: z.number(),
      appointments: z.number().int(),
      unpriced: z.number().int(),
    }),
  })
  .meta({ id: 'EarningsReportDto' });

export const ScheduleAppointmentRequestSchema = z
  .object({ patientId: z.uuid(), ...slotShape })
  .meta({ id: 'ScheduleAppointmentRequestDto' });

export const RescheduleAppointmentRequestSchema = z
  .object(slotShape)
  .meta({ id: 'RescheduleAppointmentRequestDto' });

export const AppointmentIdParamsSchema = z.object({ id: z.uuid() });
export const AppointmentPageSchema = pageOf(AppointmentSchema, 'AppointmentPageDto');

export const ListAppointmentsQuerySchema = PageQuerySchema.extend({
  from: z.iso.datetime().meta({ description: 'Inclusive start of the range' }),
  to: z.iso.datetime().meta({ description: 'Exclusive end of the range (max 62 days)' }),
});

export type AppointmentDto = z.infer<typeof AppointmentSchema>;
export type AppointmentPageDto = z.infer<typeof AppointmentPageSchema>;
export type ScheduleAppointmentRequestDto = z.infer<typeof ScheduleAppointmentRequestSchema>;
export type RescheduleAppointmentRequestDto = z.infer<typeof RescheduleAppointmentRequestSchema>;
export type ConsultationFeesDto = z.infer<typeof ConsultationFeesSchema>;
export type UpdateConsultationFeesRequestDto = z.infer<typeof UpdateConsultationFeesRequestSchema>;
export type EarningsQueryDto = z.infer<typeof EarningsQuerySchema>;
export type EarningsReportDto = z.infer<typeof EarningsReportSchema>;

export function registerAppointmentContracts(registry: ContractRegistry): void {
  const tags = ['Appointments'];
  const notFound = { description: 'Appointment or patient not found', schema: ErrorResponseSchema };
  const conflict = {
    description: 'Time slot already taken, or appointment cancelled',
    schema: ErrorResponseSchema,
  };
  const invalid = { description: 'Invalid data', schema: ErrorResponseSchema };

  registry.registerRoute({
    method: 'get',
    path: '/appointments',
    operationId: 'listAppointments',
    summary: 'CU-10 Agenda: appointments starting in a range (month or day)',
    tags,
    auth: true,
    request: { query: ListAppointmentsQuerySchema },
    responses: {
      200: { description: 'Appointments ordered by start', schema: AppointmentPageSchema },
      400: invalid,
    },
  });
  registry.registerRoute({
    method: 'get',
    path: '/appointments/fees',
    operationId: 'getConsultationFees',
    summary: 'Consultation fees per appointment type (default fee of new appointments)',
    tags,
    auth: true,
    responses: { 200: { description: 'Fee table', schema: ConsultationFeesSchema } },
  });
  registry.registerRoute({
    method: 'put',
    path: '/appointments/fees',
    operationId: 'updateConsultationFees',
    summary: 'Set the consultation fee of each appointment type',
    tags,
    auth: true,
    request: { body: UpdateConsultationFeesRequestSchema },
    responses: {
      200: { description: 'Fee table saved', schema: ConsultationFeesSchema },
      400: invalid,
    },
  });
  registry.registerRoute({
    method: 'get',
    path: '/appointments/earnings',
    operationId: 'getEarningsReport',
    summary:
      'Earnings per month from the fees of held (earned) and upcoming (projected) appointments',
    tags,
    auth: true,
    request: { query: EarningsQuerySchema },
    responses: {
      200: { description: 'Monthly earnings', schema: EarningsReportSchema },
      400: invalid,
    },
  });
  registry.registerRoute({
    method: 'post',
    path: '/appointments',
    operationId: 'scheduleAppointment',
    summary: 'CU-10 Schedule an appointment',
    tags,
    auth: true,
    request: { body: ScheduleAppointmentRequestSchema },
    responses: {
      201: { description: 'Appointment scheduled', schema: AppointmentSchema },
      400: invalid,
      404: notFound,
      409: conflict,
    },
  });
  registry.registerRoute({
    method: 'get',
    path: '/appointments/{id}',
    operationId: 'getAppointment',
    summary: 'CU-10 Appointment detail',
    tags,
    auth: true,
    request: { params: AppointmentIdParamsSchema },
    responses: { 200: { description: 'Appointment', schema: AppointmentSchema }, 404: notFound },
  });
  registry.registerRoute({
    method: 'put',
    path: '/appointments/{id}',
    operationId: 'rescheduleAppointment',
    summary: 'CU-10 Modify an appointment (time, duration, type, modality, notes)',
    tags,
    auth: true,
    request: { params: AppointmentIdParamsSchema, body: RescheduleAppointmentRequestSchema },
    responses: {
      200: { description: 'Appointment updated', schema: AppointmentSchema },
      400: invalid,
      404: notFound,
      409: conflict,
    },
  });
  registry.registerRoute({
    method: 'post',
    path: '/appointments/{id}/cancel',
    operationId: 'cancelAppointment',
    summary: 'CU-10 Cancel an appointment',
    tags,
    auth: true,
    request: { params: AppointmentIdParamsSchema },
    responses: {
      200: { description: 'Appointment cancelled', schema: AppointmentSchema },
      404: notFound,
      409: conflict,
    },
  });
}
