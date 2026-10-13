import { z } from 'zod';
import { ErrorResponseSchema } from '#core/contracts/ErrorResponse';
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
    cancelledAt: z.iso.datetime().nullable(),
  })
  .meta({ id: 'AppointmentDto' });

const slotShape = {
  startsAt: z.iso.datetime(),
  durationMinutes: z.number().int().min(10).max(240),
  type: AppointmentTypeSchema,
  modality: AppointmentModalitySchema,
  notes: z.string().trim().max(1000).nullable().optional(),
};

export const ScheduleAppointmentRequestSchema = z
  .object({ patientId: z.uuid(), ...slotShape })
  .meta({ id: 'ScheduleAppointmentRequestDto' });

export const RescheduleAppointmentRequestSchema = z
  .object(slotShape)
  .meta({ id: 'RescheduleAppointmentRequestDto' });

export const AppointmentIdParamsSchema = z.object({ id: z.uuid() });
export const ListAppointmentsQuerySchema = z.object({
  from: z.iso.datetime().meta({ description: 'Inclusive start of the range' }),
  to: z.iso.datetime().meta({ description: 'Exclusive end of the range (max 62 days)' }),
});

export type AppointmentDto = z.infer<typeof AppointmentSchema>;
export type ScheduleAppointmentRequestDto = z.infer<typeof ScheduleAppointmentRequestSchema>;
export type RescheduleAppointmentRequestDto = z.infer<typeof RescheduleAppointmentRequestSchema>;

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
      200: { description: 'Appointments ordered by start', schema: z.array(AppointmentSchema) },
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
