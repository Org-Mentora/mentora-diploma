import type { View } from '#core/view/View';
import type { HealthDto } from '../contracts/health.contracts';
import type { HealthScope } from '../model/HealthService';
import type { GetHealthPresenter } from './GetHealthPresenter';

// Abstract Factory
export interface HealthPresenterFactory {
  getHealth(view: View<HealthDto>, scope?: HealthScope): GetHealthPresenter;
}
