import type { View } from '#core/view/View';
import type { HealthDto } from '../contracts/health.contracts';
import type { GetHealthPresenter } from './GetHealthPresenter';

/**
 * Builds presenters bound to a per-request view. Implemented by the module composition
 * root, so views never touch the Model to construct a presenter.
 */
export interface HealthPresenterFactory {
  getHealth(view: View<HealthDto>): GetHealthPresenter;
}
