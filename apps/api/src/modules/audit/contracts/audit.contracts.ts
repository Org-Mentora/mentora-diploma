import { z } from 'zod';
import { errorResponse } from '#core/contracts/ErrorResponse';
import { PageQuerySchema, pageOf } from '#core/contracts/Pagination';
import { type ContractRegistry, moduleRoutes } from '#core/module/ContractRegistry';

export const AuditEventSchema = z
  .object({
    id: z.uuid(),
    action: z.string().meta({ description: '`<category>.<verb>`, e.g. `patient.created`' }),
    category: z.string(),
    actor: z.enum(['professional', 'patient', 'system']),
    targetType: z.string().nullable(),
    targetId: z.string().nullable(),
    details: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])),
    ip: z.string().nullable(),
    userAgent: z.string().nullable(),
    occurredAt: z.iso.datetime(),
  })
  .meta({ id: 'AuditEventDto' });

export const AuditEventPageSchema = pageOf(AuditEventSchema, 'AuditEventPageDto');

export const ListAuditEventsQuerySchema = PageQuerySchema.extend({
  category: z
    .string()
    .regex(/^[a-z_]+$/)
    .optional()
    .meta({ description: 'session, account, patient, consultation, appointment, booking, …' }),
  from: z.iso.datetime().optional(),
  to: z.iso.datetime().optional(),
});

export type AuditEventDto = z.infer<typeof AuditEventSchema>;
export type AuditEventPageDto = z.infer<typeof AuditEventPageSchema>;
export type ListAuditEventsQueryDto = z.infer<typeof ListAuditEventsQuerySchema>;

export function registerAuditContracts(registry: ContractRegistry): void {
  const route = moduleRoutes(registry, { tags: ['Audit'], auth: true });

  route({
    method: 'get',
    path: '/audit/events',
    operationId: 'listAuditEvents',
    summary: 'User audit trail: what was done in the account, when and from where (newest first)',
    request: { query: ListAuditEventsQuerySchema },
    responses: {
      200: { description: 'One page of audit events', schema: AuditEventPageSchema },
      400: errorResponse('Invalid filter'),
    },
  });
}
