import { ApplicationError } from '#core/errors/ApplicationError';
import type { ErrorViewModel, View } from '#core/view/View';

// Template Method
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
