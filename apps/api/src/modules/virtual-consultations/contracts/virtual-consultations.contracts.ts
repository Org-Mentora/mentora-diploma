import { z } from 'zod';
import { errorResponse } from '#core/contracts/ErrorResponse';
import { PageQuerySchema, pageOf } from '#core/contracts/Pagination';
import { type ContractRegistry, moduleRoutes } from '#core/module/ContractRegistry';

export const VirtualMeetingSchema = z
  .object({
    id: z.uuid(),
    patientId: z.uuid(),
    appointmentId: z.uuid().nullable(),
    provider: z.enum(['jitsi', 'google_meet']),
    joinUrl: z.url(),
    invitationStatus: z.enum(['pending', 'sent', 'failed', 'skipped']),
    invitationError: z.string().nullable(),
    createdAt: z.iso.datetime(),
  })
  .meta({ id: 'VirtualMeetingDto' });

export const StartVirtualMeetingRequestSchema = z
  .object({
    patientId: z.uuid(),
    appointmentId: z
      .uuid()
      .nullable()
      .optional()
      .meta({ description: 'Virtual appointment the call belongs to; omit from the patient file' }),
  })
  .meta({ id: 'StartVirtualMeetingRequestDto' });

export const VirtualMeetingPageSchema = pageOf(VirtualMeetingSchema, 'VirtualMeetingPageDto');

export const ListVirtualMeetingsQuerySchema = PageQuerySchema.extend({
  patientId: z.uuid().optional(),
  appointmentId: z.uuid().optional(),
}).refine((query) => Boolean(query.patientId ?? query.appointmentId), {
  message: 'patientId or appointmentId is required',
});

export type VirtualMeetingDto = z.infer<typeof VirtualMeetingSchema>;
export type VirtualMeetingPageDto = z.infer<typeof VirtualMeetingPageSchema>;
export type StartVirtualMeetingRequestDto = z.infer<typeof StartVirtualMeetingRequestSchema>;
export type ListVirtualMeetingsQueryDto = z.infer<typeof ListVirtualMeetingsQuerySchema>;

export function registerVirtualConsultationContracts(registry: ContractRegistry): void {
  const tags = ['VirtualConsultations'];
  const route = moduleRoutes(registry, { tags, auth: true });
  route({
    method: 'post',
    path: '/virtual-meetings',
    operationId: 'startVirtualMeeting',
    summary: 'CU-15 Create the video call link and send it to the patient',
    request: { body: StartVirtualMeetingRequestSchema },
    responses: {
      201: {
        description: 'Meeting created (or the existing one of the appointment)',
        schema: VirtualMeetingSchema,
      },
      400: errorResponse('Not a scheduled virtual appointment'),
      404: errorResponse('Patient or appointment not found'),
      503: errorResponse('The video platform is not available'),
    },
  });
  route({
    method: 'get',
    path: '/virtual-meetings',
    operationId: 'listVirtualMeetings',
    summary: "CU-15 A patient's virtual meeting history, or the meeting of an appointment",
    request: {
      query: PageQuerySchema.extend({
        patientId: z.uuid().optional(),
        appointmentId: z.uuid().optional(),
      }),
    },
    responses: {
      200: { description: 'Newest first', schema: VirtualMeetingPageSchema },
      400: errorResponse('Missing filter'),
    },
  });
}
