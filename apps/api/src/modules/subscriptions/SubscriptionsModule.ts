import type { Router } from 'express';
import type { DateFormatter } from '#core/format/DateFormatter';
import type { AppLogger } from '#core/logging/AppLogger';
import type { AuditTrail } from '#core/model/AuditTrail';
import type { Clock } from '#core/model/Clock';
import type { IdGenerator } from '#core/model/IdGenerator';
import type { TransactionManager } from '#core/model/TransactionManager';
import type { AppModule } from '#core/module/AppModule';
import type { ContractRegistry } from '#core/module/ContractRegistry';
import type { ScheduledJob } from '#core/scheduling/ScheduledJob';
import type { TransactionContext } from '#infrastructure/database/TransactionContext';
import type { AuthGuard } from '#infrastructure/http/AuthGuard';
import type { MailTransport } from '#infrastructure/mail/MailTransport';
import { registerSubscriptionContracts } from './contracts/subscriptions.contracts';
import { EmailBillingNotifier } from './infrastructure/EmailBillingNotifier';
import { MongoosePaymentRepository } from './infrastructure/MongoosePaymentRepository';
import { MongooseSubscriptionRepository } from './infrastructure/MongooseSubscriptionRepository';
import type { PaymentGateway } from './model/PaymentGateway';
import type { PaymentRepository } from './model/PaymentRepository';
import { PlanCatalog, type PlanPrices } from './model/Plan';
import { SubscriptionAccess } from './model/SubscriptionAccess';
import type { SubscriptionRepository } from './model/SubscriptionRepository';
import { SubscriptionService } from './model/SubscriptionService';
import { SubscriptionPresenters } from './presenter/SubscriptionPresenters';
import { SubscriptionRoutes } from './view/SubscriptionRoutes';

export interface SubscriptionsModuleDependencies {
  guard: AuthGuard;
  clock: Clock;
  ids: IdGenerator;
  transactions: TransactionManager;
  context: TransactionContext;
  gateway: PaymentGateway;
  mail: MailTransport;
  dates: DateFormatter;
  logger: AppLogger;
  prices: PlanPrices;
  audit: AuditTrail;
  trialDays: number;
  planUrl: string;
  subscriptions?: SubscriptionRepository;
  payments?: PaymentRepository;
}

const HOUR_MS = 60 * 60 * 1000;

// Composition Root
export class SubscriptionsModule implements AppModule {
  readonly basePath = '/subscription';
  readonly access: SubscriptionAccess;
  readonly #service: SubscriptionService;
  readonly #logger: AppLogger;

  constructor(private readonly deps: SubscriptionsModuleDependencies) {
    const subscriptions = deps.subscriptions ?? new MongooseSubscriptionRepository(deps.context);
    this.#logger = deps.logger.child({ module: 'subscriptions' });
    this.access = new SubscriptionAccess(subscriptions, deps.clock, deps.trialDays);
    this.#service = new SubscriptionService(
      subscriptions,
      deps.payments ?? new MongoosePaymentRepository(deps.context),
      deps.transactions,
      deps.gateway,
      new EmailBillingNotifier(deps.mail, deps.dates, deps.planUrl, this.#logger),
      new PlanCatalog(deps.prices),
      deps.clock,
      deps.ids,
      deps.audit,
    );
  }

  registerContracts(registry: ContractRegistry): void {
    registerSubscriptionContracts(registry);
  }

  createRouter(): Router {
    return new SubscriptionRoutes(
      new SubscriptionPresenters(this.#service),
      this.deps.guard,
    ).build();
  }

  scheduledJobs(): ScheduledJob[] {
    return [
      {
        name: 'subscriptions.process-renewals',
        intervalMs: HOUR_MS,
        run: async () => {
          const { processed, failed, errors } = await this.#service.processDueRenewals();
          for (const { professionalId, error } of errors) {
            this.#logger.error('Subscription renewal failed', { professionalId, err: error });
          }
          if (processed > 0) {
            this.#logger.info('Subscription renewals processed', { processed, failed });
          }
        },
      },
    ];
  }
}
