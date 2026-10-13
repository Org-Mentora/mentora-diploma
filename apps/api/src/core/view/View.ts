import type { ErrorKind } from '#core/errors/ApplicationError';

/** What a Presenter hands to a View when a use case fails with a known error. */
export interface ErrorViewModel {
  kind: ErrorKind;
  code: string;
  message: string;
  details?: unknown;
}

/**
 * Passive View contract (MVP). A View only renders what the Presenter gives it;
 * it never calls the Model and holds no logic beyond formatting for its transport.
 */
export interface View<TViewModel> {
  render(viewModel: TViewModel): void;
  renderError(error: ErrorViewModel): void;
}
