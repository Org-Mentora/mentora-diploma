export type ErrorKind =
  | 'validation'
  | 'not_found'
  | 'conflict'
  | 'unauthorized'
  | 'forbidden'
  | 'payment_required'
  | 'unavailable'
  | 'too_many_requests';

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

  constructor(message: string, details?: unknown, code = 'VALIDATION_ERROR') {
    super(message, code, details);
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

  constructor(message: string, details?: unknown, code = 'CONFLICT') {
    super(message, code, details);
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

  constructor(message = 'You are not allowed to perform this action', code = 'FORBIDDEN') {
    super(message, code);
  }
}

export class SubscriptionInactiveError extends ForbiddenError {
  constructor() {
    super('Your subscription is not active. Choose a plan to continue.', 'SUBSCRIPTION_INACTIVE');
  }
}

export class PaymentDeclinedError extends ApplicationError {
  readonly kind = 'payment_required';

  constructor(message: string, details?: unknown) {
    super(message, 'PAYMENT_DECLINED', details);
  }
}

export class ServiceUnavailableError extends ApplicationError {
  readonly kind = 'unavailable';

  constructor(message: string, code = 'SERVICE_UNAVAILABLE') {
    super(message, code);
  }
}

export class TooManyRequestsError extends ApplicationError {
  readonly kind = 'too_many_requests';

  constructor(readonly retryAfterSeconds: number) {
    super('Too many attempts. Wait a few minutes and try again.', 'TOO_MANY_REQUESTS', {
      retryAfterSeconds,
    });
  }
}
