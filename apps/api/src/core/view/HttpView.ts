import type { ErrorKind } from '#core/errors/ApplicationError';
import type { HttpResponder } from './HttpResponder';
import type { ErrorViewModel, View } from './View';

const STATUS_BY_KIND: Record<ErrorKind, number> = {
  validation: 400,
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  conflict: 409,
  payment_required: 402,
  unavailable: 503,
  too_many_requests: 429,
};

export interface ErrorResponseBody {
  error: { code: string; message: string; details?: unknown };
}

// Passive View, Template Method
export abstract class HttpView<TViewModel> implements View<TViewModel> {
  protected readonly successStatus: number = 200;

  constructor(protected readonly responder: HttpResponder) {}

  render(viewModel: TViewModel): void {
    this.responder.send(this.successStatus, viewModel);
  }

  renderError(error: ErrorViewModel): void {
    const body: ErrorResponseBody = {
      error: { code: error.code, message: error.message, details: error.details },
    };
    this.responder.send(STATUS_BY_KIND[error.kind], body);
  }
}
