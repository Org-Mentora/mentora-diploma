import { type ZodType, z } from 'zod';

export const PageQuerySchema = z.object({
  cursor: z
    .string()
    .max(512)
    .optional()
    .meta({ description: 'Opaque cursor: the `nextCursor` of the previous page' }),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .meta({ description: 'Page size (default 20, max 100)' }),
});

export function pageOf<T extends ZodType>(item: T, id: string) {
  return z
    .object({
      items: z.array(item),
      nextCursor: z
        .string()
        .nullable()
        .meta({ description: 'Pass it as `cursor` to get the next page; null on the last page' }),
    })
    .meta({ id });
}
