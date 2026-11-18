import { ApplicationError } from '#core/errors/ApplicationError';
import { toErrorViewModel, type View } from '#core/view/View';

// Template Method
export abstract class Presenter<TInput, TViewModel, TModel> {
  constructor(
    protected readonly view: View<TViewModel>,
    protected readonly model: TModel,
  ) {}

  async present(input: TInput): Promise<void> {
    let viewModel: TViewModel;
    try {
      viewModel = await this.execute(input);
    } catch (error) {
      if (error instanceof ApplicationError) {
        this.view.renderError(toErrorViewModel(error));
        return;
      }
      throw error;
    }
    this.view.render(viewModel);
  }

  protected abstract execute(input: TInput): Promise<TViewModel>;
}
