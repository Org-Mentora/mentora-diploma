import type { ApplicationError, ErrorKind } from '#core/errors/ApplicationError';

export interface ErrorViewModel {
  kind: ErrorKind;
  code: string;
  message: string;
  details?: unknown;
}

export function toErrorViewModel(error: ApplicationError): ErrorViewModel {
  return { kind: error.kind, code: error.code, message: error.message, details: error.details };
}

// Passive View
export interface View<TViewModel> {
  render(viewModel: TViewModel): void;
  renderError(error: ErrorViewModel): void;
}
