import type { Router } from 'express';
import { SystemClock } from '#core/model/Clock';
import type { AppModule } from '#core/module/AppModule';
import type { ContractRegistry } from '#core/module/ContractRegistry';
import type { View } from '#core/view/View';
import { MongoConnection } from '#infrastructure/database/MongoConnection';
import { type HealthDto, registerHealthContracts } from './contracts/health.contracts';
import { MongoHealthIndicator } from './infrastructure/MongoHealthIndicator';
import { ProcessUptimeSource } from './infrastructure/ProcessUptimeSource';
import { HealthService } from './model/HealthService';
import { GetHealthPresenter } from './presenter/GetHealthPresenter';
import type { HealthPresenterFactory } from './presenter/HealthPresenterFactory';
import { HealthRoutes } from './view/HealthRoutes';

/** Composition root of the health module: the only file that sees every layer. */
export class HealthModule implements AppModule, HealthPresenterFactory {
  readonly basePath = '/health';

  constructor(
    private readonly service: HealthService = new HealthService(
      [new MongoHealthIndicator(MongoConnection.getInstance())],
      new SystemClock(),
      new ProcessUptimeSource(),
    ),
  ) {}

  registerContracts(registry: ContractRegistry): void {
    registerHealthContracts(registry);
  }

  createRouter(): Router {
    return new HealthRoutes(this).build();
  }

  getHealth(view: View<HealthDto>): GetHealthPresenter {
    return new GetHealthPresenter(view, this.service);
  }
}
