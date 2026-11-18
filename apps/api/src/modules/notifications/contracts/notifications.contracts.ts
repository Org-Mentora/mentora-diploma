import { z } from 'zod';
import { PageQuerySchema, pageOf } from '#core/contracts/Pagination';
import type { ContractRegistry } from '#core/module/ContractRegistry';

export const NotificationSchema = z
  .object({
    id: z.uuid(),
    patientId: z.uuid(),
    channel: z.enum(['whatsapp', 'email']),
    topic: z.enum([
      'appointment_scheduled',
      'appointment_rescheduled',
      'appointment_cancelled',
      'appointment_reminder',
      'virtual_meeting',
    ]),
    recipient: z.string().nullable(),
    body: z.string(),
    status: z.enum(['sent', 'failed', 'skipped']),
    attempts: z.number().int(),
    error: z.string().nullable(),
    createdAt: z.iso.datetime(),
  })
  .meta({ id: 'NotificationDto' });

export const NotificationPageSchema = pageOf(NotificationSchema, 'NotificationPageDto');

export const ListNotificationsQuerySchema = PageQuerySchema.extend({ patientId: z.uuid() });

export type NotificationDto = z.infer<typeof NotificationSchema>;
export type NotificationPageDto = z.infer<typeof NotificationPageSchema>;

export function registerNotificationContracts(registry: ContractRegistry): void {
  registry.registerRoute({
    method: 'get',
    path: '/notifications',
    operationId: 'listNotifications',
    summary: 'CU-14 WhatsApp and email messages sent to a patient and their delivery result',
    tags: ['Notifications'],
    auth: true,
    request: { query: ListNotificationsQuerySchema },
    responses: {
      200: { description: 'Newest first', schema: NotificationPageSchema },
    },
  });
}
