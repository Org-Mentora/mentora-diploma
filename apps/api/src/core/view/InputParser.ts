import type { ZodType } from 'zod';
import { ValidationError } from '#core/errors/ApplicationError';

export class InputParser {
  static parse<T>(schema: ZodType<T>, raw: unknown): T {
    const result = schema.safeParse(raw);
    if (!result.success) {
      throw new ValidationError('Request validation failed', result.error.issues);
    }
    return result.data;
  }
}
