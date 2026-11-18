import { z } from 'zod';
import { errorResponse } from '#core/contracts/ErrorResponse';
import { PageQuerySchema, pageOf } from '#core/contracts/Pagination';
import { type ContractRegistry, moduleRoutes } from '#core/module/ContractRegistry';

const ModalitySchema = z.enum(['in_person', 'virtual']);
const TimeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const SlugSchema = z.string().regex(/^[a-z0-9-]{3,60}$/);

const WeeklyWindowSchema = z.object({
  weekday: z.number().int().min(1).max(7).meta({ description: 'ISO weekday: 1 Monday … 7 Sunday' }),
  start: TimeSchema,
  end: TimeSchema,
});

const settingsShape = {
  enabled: z.boolean(),
  slotMinutes: z.number().int().min(15).max(240),
  minNoticeHours: z.number().int().min(0).max(168),
  horizonDays: z.number().int().min(1).max(90),
  modalities: z.array(ModalitySchema).min(1),
  weeklyHours: z.array(WeeklyWindowSchema).max(21),
  instructions: z.string().trim().max(1000).nullable(),
};

export const BookingSettingsSchema = z
  .object({
    slug: z.string(),
    timezone: z.string(),
    ...settingsShape,
  })
  .meta({ id: 'BookingSettingsDto' });

export const UpdateBookingSettingsRequestSchema = z
  .object(settingsShape)
  .meta({ id: 'UpdateBookingSettingsRequestDto' });

export const PublicBookingPageSchema = z
  .object({
    slug: z.string(),
    professional: z.object({
      fullName: z.string(),
      specialty: z.string(),
      offices: z.array(z.string()),
    }),
    slotMinutes: z.number().int(),
    horizonDays: z.number().int(),
    modalities: z.array(ModalitySchema),
    instructions: z.string().nullable(),
    timezone: z.string(),
  })
  .meta({ id: 'PublicBookingPageDto' });

export const AvailableSlotsSchema = z
  .object({
    timezone: z.string(),
    days: z.array(z.object({ date: z.string(), slots: z.array(z.iso.datetime()) })),
  })
  .meta({ id: 'AvailableSlotsDto' });

export const CreateBookingRequestSchema = z
  .object({
    firstName: z.string().trim().min(1).max(80),
    lastName: z.string().trim().min(1).max(80),
    dni: z.string().trim().min(7).max(12),
    birthDate: z.iso.date().nullable().optional(),
    phone: z.string().trim().max(40).nullable().optional(),
    email: z.email().nullable().optional(),
    startsAt: z.iso.datetime(),
    modality: ModalitySchema,
    reason: z.string().trim().max(500).nullable().optional(),
    website: z.string().max(0).optional().meta({ description: 'Honeypot: must stay empty' }),
  })
  .meta({ id: 'CreateBookingRequestDto' });

export const BookingReceiptSchema = z
  .object({
    id: z.uuid(),
    startsAt: z.iso.datetime(),
    durationMinutes: z.number().int(),
    modality: ModalitySchema,
    status: z.literal('pending'),
  })
  .meta({ id: 'BookingReceiptDto' });

export const BookingRequestStatusSchema = z.enum(['pending', 'accepted', 'rejected', 'expired']);

export const BookingRequestSchema = z
  .object({
    id: z.uuid(),
    requester: z.object({
      firstName: z.string(),
      lastName: z.string(),
      dni: z.string(),
      birthDate: z.iso.date().nullable(),
      phone: z.string().nullable(),
      email: z.string().nullable(),
    }),
    existingPatientId: z.uuid().nullable().meta({
      description: 'Patient with the same DNI, if the requester is already a patient',
    }),
    startsAt: z.iso.datetime(),
    endsAt: z.iso.datetime(),
    durationMinutes: z.number().int(),
    modality: ModalitySchema,
    reason: z.string().nullable(),
    status: BookingRequestStatusSchema,
    appointmentId: z.uuid().nullable(),
    rejectionReason: z.string().nullable(),
    createdAt: z.iso.datetime(),
    decidedAt: z.iso.datetime().nullable(),
  })
  .meta({ id: 'BookingRequestDto' });

export const AcceptBookingRequestSchema = z
  .object({
    type: z.enum(['first_visit', 'control', 'follow_up', 'medication', 'other']),
    notes: z.string().trim().max(1000).nullable().optional(),
  })
  .meta({ id: 'AcceptBookingRequestDto' });

export const RejectBookingRequestSchema = z
  .object({ reason: z.string().trim().max(500).nullable().optional() })
  .meta({ id: 'RejectBookingRequestDto' });

export const SlugParamsSchema = z.object({ slug: SlugSchema });
export const RequestIdParamsSchema = z.object({ id: z.uuid() });
export const AvailableSlotsQuerySchema = z.object({
  from: z.iso.date().optional().meta({ description: 'First day (YYYY-MM-DD); default today' }),
  days: z.coerce.number().int().min(1).max(14).default(7),
});
export const BookingRequestPageSchema = pageOf(BookingRequestSchema, 'BookingRequestPageDto');

export const ListBookingRequestsQuerySchema = PageQuerySchema.extend({
  status: BookingRequestStatusSchema.optional(),
});

export type BookingSettingsDto = z.infer<typeof BookingSettingsSchema>;
export type BookingRequestPageDto = z.infer<typeof BookingRequestPageSchema>;
export type UpdateBookingSettingsRequestDto = z.infer<typeof UpdateBookingSettingsRequestSchema>;
export type PublicBookingPageDto = z.infer<typeof PublicBookingPageSchema>;
export type AvailableSlotsDto = z.infer<typeof AvailableSlotsSchema>;
export type CreateBookingRequestDto = z.infer<typeof CreateBookingRequestSchema>;
export type BookingReceiptDto = z.infer<typeof BookingReceiptSchema>;
export type BookingRequestDto = z.infer<typeof BookingRequestSchema>;
export type AcceptBookingRequestDto = z.infer<typeof AcceptBookingRequestSchema>;
export type RejectBookingRequestDto = z.infer<typeof RejectBookingRequestSchema>;
export type AvailableSlotsQueryDto = z.infer<typeof AvailableSlotsQuerySchema>;
export type BookingRequestStatusDto = z.infer<typeof BookingRequestStatusSchema>;

export function registerBookingContracts(registry: ContractRegistry): void {
  const tags = ['Online booking'];
  const route = moduleRoutes(registry, { tags });
  const invalid = errorResponse('Invalid data');
  const notFound = errorResponse('Not found');
  const conflict = errorResponse('Time taken or request already decided');

  route({
    method: 'get',
    path: '/booking/settings',
    operationId: 'getBookingSettings',
    summary: 'Online booking settings and public link of the professional',
    auth: true,
    responses: { 200: { description: 'Settings', schema: BookingSettingsSchema } },
  });
  route({
    method: 'put',
    path: '/booking/settings',
    operationId: 'updateBookingSettings',
    summary: 'Enable online booking and set office hours, slot length and notice',
    auth: true,
    request: { body: UpdateBookingSettingsRequestSchema },
    responses: { 200: { description: 'Saved', schema: BookingSettingsSchema }, 400: invalid },
  });
  route({
    method: 'get',
    path: '/booking/requests',
    operationId: 'listBookingRequests',
    summary: 'Appointment requests sent by patients (pending first by date)',
    auth: true,
    request: { query: ListBookingRequestsQuerySchema },
    responses: {
      200: {
        description: 'Pending by start; others newest first',
        schema: BookingRequestPageSchema,
      },
    },
  });
  route({
    method: 'post',
    path: '/booking/requests/{id}/accept',
    operationId: 'acceptBookingRequest',
    summary: 'Accept a request: registers the patient if new and schedules the appointment',
    tags: [...tags, 'Appointments', 'Patients'],
    auth: true,
    request: { params: RequestIdParamsSchema, body: AcceptBookingRequestSchema },
    responses: {
      200: { description: 'Accepted', schema: BookingRequestSchema },
      400: invalid,
      404: notFound,
      409: conflict,
    },
  });
  route({
    method: 'post',
    path: '/booking/requests/{id}/reject',
    operationId: 'rejectBookingRequest',
    summary: 'Reject a request (the patient is told by email when possible)',
    auth: true,
    request: { params: RequestIdParamsSchema, body: RejectBookingRequestSchema },
    responses: {
      200: { description: 'Rejected', schema: BookingRequestSchema },
      404: notFound,
      409: conflict,
    },
  });
  route({
    method: 'get',
    path: '/booking/public/{slug}',
    operationId: 'getPublicBookingPage',
    summary: 'Public: booking page of a professional',
    request: { params: SlugParamsSchema },
    responses: { 200: { description: 'Page', schema: PublicBookingPageSchema }, 404: notFound },
  });
  route({
    method: 'get',
    path: '/booking/public/{slug}/slots',
    operationId: 'getAvailableSlots',
    summary: 'Public: free slots per day',
    request: { params: SlugParamsSchema, query: AvailableSlotsQuerySchema },
    responses: {
      200: { description: 'Free slots', schema: AvailableSlotsSchema },
      400: invalid,
      404: notFound,
    },
  });
  route({
    method: 'post',
    path: '/booking/public/{slug}/requests',
    operationId: 'createBookingRequest',
    summary: 'Public: a patient asks for an appointment; the professional accepts or rejects it',
    request: { params: SlugParamsSchema, body: CreateBookingRequestSchema },
    responses: {
      201: { description: 'Request received', schema: BookingReceiptSchema },
      400: invalid,
      404: notFound,
      409: conflict,
      429: errorResponse('Too many requests'),
    },
  });
}
