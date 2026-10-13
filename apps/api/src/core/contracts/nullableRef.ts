import { type ZodType, z } from 'zod';

/**
 * Nullable reference to a named DTO schema. Prefer this over `.nullable()` on a schema with
 * `.meta({ id })`: the OpenAPI generator would otherwise register the nullable variant as the
 * component itself when it meets it first, making every other usage nullable too.
 */
export function nullableRef<T extends ZodType>(schema: T) {
  return z.union([schema, z.null()]);
}
