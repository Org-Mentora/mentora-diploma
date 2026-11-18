import type { RequestHandler, Router } from 'express';
import type { AuditTrail } from '#core/model/AuditTrail';
import type { Clock } from '#core/model/Clock';
import type { IdGenerator } from '#core/model/IdGenerator';
import type { AppModule } from '#core/module/AppModule';
import type { ContractRegistry } from '#core/module/ContractRegistry';
import type { TransactionContext } from '#infrastructure/database/TransactionContext';
import type { AuthGuard } from '#infrastructure/http/AuthGuard';
import type { RequestOriginContext } from '#infrastructure/http/RequestOriginContext';
import { registerAuditContracts } from './contracts/audit.contracts';
import { MongooseAuditEventRepository } from './infrastructure/MongooseAuditEventRepository';
import { RequestOriginContextSource } from './infrastructure/RequestOriginContextSource';
import type { AuditEventRepository } from './model/AuditEventRepository';
import { AuditLog } from './model/AuditLog';
import { AuditService } from './model/AuditService';
import { AuditPresenters } from './presenter/AuditPresenters';
import { AuditRoutes } from './view/AuditRoutes';

export interface AuditModuleDependencies {
  guard: AuthGuard;
  clock: Clock;
  ids: IdGenerator;
  context: TransactionContext;
  origins: RequestOriginContext;
  repository?: AuditEventRepository;
}

// Composition Root
export class AuditModule implements AppModule {
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
    return new AuditRoutes(new AuditPresenters(this.#service), this.deps.guard).build();
  }
}
