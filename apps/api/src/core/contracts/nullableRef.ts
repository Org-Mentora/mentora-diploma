import { type ZodType, z } from 'zod';

export function nullableRef<T extends ZodType>(schema: T) {
  return z.union([schema, z.null()]);
}
