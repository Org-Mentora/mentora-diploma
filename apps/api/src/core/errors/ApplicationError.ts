/**
 * Transport-agnostic error categories. Views decide how each kind is rendered
 * (the HTTP view maps `not_found` to 404); the Model never knows about status codes.
 */
export type ErrorKind = 'validation' | 'not_found' | 'conflict' | 'unauthorized' | 'forbidden';

export abstract class ApplicationError extends Error {
  abstract readonly kind: ErrorKind;

  protected constructor(
    message: string,
    readonly code: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationError extends ApplicationError {
  readonly kind = 'validation';

  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', details);
  }
}

export class NotFoundError extends ApplicationError {
  readonly kind = 'not_found';

  constructor(resource: string, id: string) {
    super(`${resource} '${id}' was not found`, 'NOT_FOUND', { resource, id });
  }
}

export class ConflictError extends ApplicationError {
  readonly kind = 'conflict';

  constructor(message: string, details?: unknown) {
    super(message, 'CONFLICT', details);
  }
}

export class UnauthorizedError extends ApplicationError {
  readonly kind = 'unauthorized';

  constructor(message = 'Authentication is required') {
    super(message, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends ApplicationError {
  readonly kind = 'forbidden';

  constructor(message = 'You are not allowed to perform this action') {
    super(message, 'FORBIDDEN');
  }
}
