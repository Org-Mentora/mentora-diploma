import type { Router } from 'express';
import type { Clock } from '#core/model/Clock';
import type { AppModule } from '#core/module/AppModule';
import type { ContractRegistry } from '#core/module/ContractRegistry';
import { registerHealthContracts } from './contracts/health.contracts';
import { ProcessUptimeSource } from './infrastructure/ProcessUptimeSource';
import type { HealthIndicator } from './model/HealthIndicator';
import { HealthService, type UptimeSource } from './model/HealthService';
import { HealthPresenters } from './presenter/HealthPresenters';
import { HealthRoutes } from './view/HealthRoutes';

export interface HealthModuleDependencies {
  indicators: readonly HealthIndicator[];
  clock: Clock;
  uptime?: UptimeSource;
}

// Composition Root
export class HealthModule implements AppModule {
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
    return new HealthRoutes(new HealthPresenters(this.#service)).build();
  }
}
