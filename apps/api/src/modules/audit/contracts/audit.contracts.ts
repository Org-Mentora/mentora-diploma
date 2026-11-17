import { z } from 'zod';
import { ErrorResponseSchema } from '#core/contracts/ErrorResponse';
import type { ContractRegistry } from '#core/module/ContractRegistry';

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

export const AuditEventPageSchema = z
  .object({
    items: z.array(AuditEventSchema),
    nextBefore: z.string().nullable().meta({
      description: 'Pass it as `before` to load the next (older) page; null on the last page',
    }),
  })
  .meta({ id: 'AuditEventPageDto' });

export const ListAuditEventsQuerySchema = z.object({
  category: z
    .string()
    .regex(/^[a-z_]+$/)
    .optional()
    .meta({ description: 'session, account, patient, consultation, appointment, booking, …' }),
  from: z.iso.datetime().optional(),
  to: z.iso.datetime().optional(),
  before: z
    .string()
    .regex(/^[^_]+_[0-9a-f-]{36}$/)
    .optional()
    .meta({ description: 'Cursor: the `nextBefore` of the previous page' }),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

export type AuditEventDto = z.infer<typeof AuditEventSchema>;
export type AuditEventPageDto = z.infer<typeof AuditEventPageSchema>;
export type ListAuditEventsQueryDto = z.infer<typeof ListAuditEventsQuerySchema>;

export function registerAuditContracts(registry: ContractRegistry): void {
  registry.registerRoute({
    method: 'get',
    path: '/audit/events',
    operationId: 'listAuditEvents',
    summary: 'User audit trail: what was done in the account, when and from where (newest first)',
    tags: ['Audit'],
    auth: true,
    request: { query: ListAuditEventsQuerySchema },
    responses: {
      200: { description: 'One page of audit events', schema: AuditEventPageSchema },
      400: { description: 'Invalid filter', schema: ErrorResponseSchema },
    },
  });
}
