import { z } from 'zod';
import { ErrorResponseSchema } from '#core/contracts/ErrorResponse';
import type { ContractRegistry } from '#core/module/ContractRegistry';

export const ComponentHealthSchema = z
  .object({
    name: z.string().meta({ example: 'mongodb' }),
    status: z.enum(['up', 'down']),
    latencyMs: z.number().int().nullable().meta({ example: 3 }),
    error: z.string().nullable(),
  })
  .meta({ id: 'ComponentHealthDto' });

export const HealthSchema = z
  .object({
    status: z.enum(['ok', 'degraded']),
    uptimeSeconds: z.number().int().meta({ example: 42 }),
    checkedAt: z.iso.datetime(),
    components: z.array(ComponentHealthSchema),
  })
  .meta({ id: 'HealthDto', description: 'Aggregated service health' });

export type ComponentHealthDto = z.infer<typeof ComponentHealthSchema>;
export type HealthDto = z.infer<typeof HealthSchema>;

export function registerHealthContracts(registry: ContractRegistry): void {
  registry.registerRoute({
    method: 'get',
    path: '/health',
    operationId: 'getHealth',
    summary: 'Report service and dependency health',
    tags: ['Health'],
    responses: {
      200: { description: 'Health report', schema: HealthSchema },
      500: { description: 'Unexpected error', schema: ErrorResponseSchema },
    },
  });
}
