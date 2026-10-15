import type { Router } from 'express';
import type { Clock } from '#core/model/Clock';
import type { AppModule } from '#core/module/AppModule';
import type { ContractRegistry } from '#core/module/ContractRegistry';
import type { View } from '#core/view/View';
import { type HealthDto, registerHealthContracts } from './contracts/health.contracts';
import { ProcessUptimeSource } from './infrastructure/ProcessUptimeSource';
import type { HealthIndicator } from './model/HealthIndicator';
import { HealthService, type UptimeSource } from './model/HealthService';
import { GetHealthPresenter } from './presenter/GetHealthPresenter';
import type { HealthPresenterFactory } from './presenter/HealthPresenterFactory';
import { HealthRoutes } from './view/HealthRoutes';

export interface HealthModuleDependencies {
  /** Probes chosen by the application composition root (e.g. `MongoHealthIndicator`). */
  indicators: readonly HealthIndicator[];
  clock: Clock;
  /** Defaults to the Node process uptime. */
  uptime?: UptimeSource;
}

/** Composition root of the health module: the only file that sees every layer. */
export class HealthModule implements AppModule, HealthPresenterFactory {
  readonly basePath = '/health';
  readonly #service: HealthService;

  constructor(deps: HealthModuleDependencies) {
    this.#service = new HealthService(
      deps.indicators,
      deps.clock,
      deps.uptime ?? new ProcessUptimeSource(),
    );
  }

  registerContracts(registry: ContractRegistry): void {
    registerHealthContracts(registry);
  }

  createRouter(): Router {
    return new HealthRoutes(this).build();
  }

  getHealth(view: View<HealthDto>): GetHealthPresenter {
    return new GetHealthPresenter(view, this.#service);
  }
}
