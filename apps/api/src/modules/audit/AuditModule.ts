import type { RequestHandler, Router } from 'express';
import type { AuditTrail } from '#core/model/AuditTrail';
import type { Clock } from '#core/model/Clock';
import type { IdGenerator } from '#core/model/IdGenerator';
import type { AppModule } from '#core/module/AppModule';
import type { ContractRegistry } from '#core/module/ContractRegistry';
import type { View } from '#core/view/View';
import type { TransactionContext } from '#infrastructure/database/TransactionContext';
import type { AuthGuard } from '#infrastructure/http/AuthGuard';
import type { RequestOriginContext } from '#infrastructure/http/RequestOriginContext';
import { type AuditEventPageDto, registerAuditContracts } from './contracts/audit.contracts';
import { MongooseAuditEventRepository } from './infrastructure/MongooseAuditEventRepository';
import { RequestOriginContextSource } from './infrastructure/RequestOriginContextSource';
import type { AuditEventRepository } from './model/AuditEventRepository';
import { AuditLog } from './model/AuditLog';
import { AuditService } from './model/AuditService';
import type { AuditPresenterFactory } from './presenter/AuditPresenterFactory';
import { ListAuditEventsPresenter } from './presenter/ListAuditEventsPresenter';
import { AuditRoutes } from './view/AuditRoutes';

export interface AuditModuleDependencies {
  guard: AuthGuard;
  clock: Clock;
  ids: IdGenerator;
  context: TransactionContext;
  origins: RequestOriginContext;
  repository?: AuditEventRepository;
}

// Composition Root, Abstract Factory
export class AuditModule implements AppModule, AuditPresenterFactory {
  readonly basePath = '/audit';
  readonly trail: AuditTrail;
  readonly #service: AuditService;

  constructor(private readonly deps: AuditModuleDependencies) {
    const repository = deps.repository ?? new MongooseAuditEventRepository(deps.context);
    this.trail = new AuditLog(
      repository,
      new RequestOriginContextSource(deps.origins),
      deps.clock,
      deps.ids,
    );
    this.#service = new AuditService(repository);
  }

  registerContracts(registry: ContractRegistry): void {
    registerAuditContracts(registry);
  }

  requestHandlers(): RequestHandler[] {
    return [this.deps.origins.capture];
  }

  createRouter(): Router {
    return new AuditRoutes(this, this.deps.guard).build();
  }

  listAuditEvents(view: View<AuditEventPageDto>): ListAuditEventsPresenter {
    return new ListAuditEventsPresenter(view, this.#service);
  }
}
