import { ApplicationError } from '#core/errors/ApplicationError';
import type { ErrorViewModel, View } from '#core/view/View';

/**
 * MVP Presenter: one class per use case. It receives input already parsed by the View,
 * drives the Model, builds the output ViewModel (a DTO) and tells the View to render it.
 *
 * Known `ApplicationError`s are rendered through `view.renderError`; anything else is
 * re-thrown so the HTTP error middleware can log it and answer with a 500.
 */
export abstract class Presenter<TInput, TViewModel> {
  constructor(protected readonly view: View<TViewModel>) {}

  async present(input: TInput): Promise<void> {
    let viewModel: TViewModel;
    try {
      viewModel = await this.execute(input);
    } catch (error) {
      if (error instanceof ApplicationError) {
        this.view.renderError(this.toErrorViewModel(error));
        return;
      }
      throw error;
    }
    this.view.render(viewModel);
  }

  protected abstract execute(input: TInput): Promise<TViewModel>;

  protected toErrorViewModel(error: ApplicationError): ErrorViewModel {
    return { kind: error.kind, code: error.code, message: error.message, details: error.details };
  }
}
