import type { ErrorKind } from '#core/errors/ApplicationError';

export interface ErrorViewModel {
  kind: ErrorKind;
  code: string;
  message: string;
  details?: unknown;
}

// Passive View
export interface View<TViewModel> {
  render(viewModel: TViewModel): void;
  renderError(error: ErrorViewModel): void;
}
