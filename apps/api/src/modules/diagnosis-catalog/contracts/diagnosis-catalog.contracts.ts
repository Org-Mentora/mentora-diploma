import { z } from 'zod';
import type { ContractRegistry } from '#core/module/ContractRegistry';

export const DiagnosisCatalogEntrySchema = z
  .object({
    code: z.string().meta({ example: 'F41.1' }),
    name: z.string().meta({ example: 'Generalized anxiety disorder' }),
    category: z.string().meta({ example: 'Anxiety disorders' }),
  })
  .meta({ id: 'DiagnosisCatalogEntryDto' });

export const SearchDiagnosesQuerySchema = z.object({
  q: z.string().trim().max(100).optional().meta({ description: 'Name or code fragment' }),
  category: z.string().trim().max(120).optional(),
});

export type DiagnosisCatalogEntryDto = z.infer<typeof DiagnosisCatalogEntrySchema>;

export function registerDiagnosisCatalogContracts(registry: ContractRegistry): void {
  registry.registerRoute({
    method: 'get',
    path: '/diagnoses',
    operationId: 'searchDiagnoses',
    summary: 'CU-11 Search the read-only DSM-5 catalog (max 50 results)',
    tags: ['Diagnoses'],
    auth: true,
    request: { query: SearchDiagnosesQuerySchema },
    responses: {
      200: { description: 'Matching diagnoses', schema: z.array(DiagnosisCatalogEntrySchema) },
    },
  });
}
