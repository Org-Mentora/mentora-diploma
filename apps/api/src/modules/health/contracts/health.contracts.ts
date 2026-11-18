import { z } from 'zod';
import { errorResponse } from '#core/contracts/ErrorResponse';
import { type ContractRegistry, moduleRoutes } from '#core/module/ContractRegistry';

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
  const route = moduleRoutes(registry, { tags: ['Health'] });

  route({
    method: 'get',
    path: '/health',
    operationId: 'getHealth',
    summary: 'Report service and dependency health',
    responses: {
      200: { description: 'Health report', schema: HealthSchema },
      500: errorResponse('Unexpected error'),
    },
  });
  route({
    method: 'get',
    path: '/health/live',
    operationId: 'getLiveness',
    summary: 'Liveness probe: the process answers (no dependency checks)',
    responses: { 200: { description: 'The process is alive', schema: HealthSchema } },
  });
  route({
    method: 'get',
    path: '/health/ready',
    operationId: 'getReadiness',
    summary: 'Readiness probe: 503 while a dependency (MongoDB) is down',
    responses: {
      200: { description: 'Ready to serve traffic', schema: HealthSchema },
      503: { description: 'A dependency is down', schema: HealthSchema },
    },
  });
}
