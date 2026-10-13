import type { ZodType } from 'zod';
import { ValidationError } from '#core/errors/ApplicationError';

/**
 * Validates raw transport input against a contract schema. Views call it before handing
 * input to a Presenter, so Presenters only ever receive well-typed data.
 */
export class InputParser {
  static parse<T>(schema: ZodType<T>, raw: unknown): T {
    const result = schema.safeParse(raw);
    if (!result.success) {
      throw new ValidationError('Request validation failed', result.error.issues);
    }
    return result.data;
  }
}
