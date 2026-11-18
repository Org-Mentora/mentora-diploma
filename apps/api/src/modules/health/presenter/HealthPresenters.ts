import type { View } from '#core/view/View';
import type { HealthDto } from '../contracts/health.contracts';
import type { HealthScope, HealthService } from '../model/HealthService';
import { GetHealthPresenter } from './GetHealthPresenter';

// Abstract Factory
export class HealthPresenters {
  constructor(private readonly health: HealthService) {}

  getHealth(view: View<HealthDto>, scope?: HealthScope) {
    return new GetHealthPresenter(view, this.health, scope);
  }
}
