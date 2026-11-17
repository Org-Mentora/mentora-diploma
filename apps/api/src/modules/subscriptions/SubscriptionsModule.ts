import type { Router } from 'express';
import type { AppLogger } from '#core/logging/AppLogger';
import type { Clock } from '#core/model/Clock';
import type { TransactionManager } from '#core/model/TransactionManager';
import type { AppModule } from '#core/module/AppModule';
import type { ContractRegistry } from '#core/module/ContractRegistry';
import type { ScheduledJob } from '#core/scheduling/ScheduledJob';
import type { View } from '#core/view/View';
import type { TransactionContext } from '#infrastructure/database/TransactionContext';
import type { DateTimeFormatter } from '#infrastructure/format/DateTimeFormatter';
import type { AuthGuard } from '#infrastructure/http/AuthGuard';
import type { MailTransport } from '#infrastructure/mail/MailTransport';
import {
  type PaymentDto,
  registerSubscriptionContracts,
  type SubscriptionDetailDto,
} from './contracts/subscriptions.contracts';
import { EmailBillingNotifier } from './infrastructure/EmailBillingNotifier';
import { MongoosePaymentRepository } from './infrastructure/MongoosePaymentRepository';
import { MongooseSubscriptionRepository } from './infrastructure/MongooseSubscriptionRepository';
import type { PaymentGateway } from './model/PaymentGateway';
import type { PaymentRepository } from './model/PaymentRepository';
import { PlanCatalog, type PlanPrices } from './model/Plan';
import { SubscriptionAccess } from './model/SubscriptionAccess';
import type { SubscriptionRepository } from './model/SubscriptionRepository';
import { SubscriptionService } from './model/SubscriptionService';
import { AddPaymentMethodPresenter } from './presenter/AddPaymentMethodPresenter';
import { CancelSubscriptionPresenter } from './presenter/CancelSubscriptionPresenter';
import { ChoosePlanPresenter } from './presenter/ChoosePlanPresenter';
import { GetSubscriptionPresenter } from './presenter/GetSubscriptionPresenter';
import { ListPaymentsPresenter } from './presenter/ListPaymentsPresenter';
import { RegisterManualPaymentPresenter } from './presenter/RegisterManualPaymentPresenter';
import { RemovePaymentMethodPresenter } from './presenter/RemovePaymentMethodPresenter';
import { SetAutoDebitPresenter } from './presenter/SetAutoDebitPresenter';
import type { SubscriptionPresenterFactory } from './presenter/SubscriptionPresenterFactory';
import { UpdatePaymentMethodPresenter } from './presenter/UpdatePaymentMethodPresenter';
import { SubscriptionRoutes } from './view/SubscriptionRoutes';

export interface SubscriptionsModuleDependencies {
  guard: AuthGuard;
  clock: Clock;
  transactions: TransactionManager;
  context: TransactionContext;
  gateway: PaymentGateway;
  mail: MailTransport;
  dates: DateTimeFormatter;
  logger: AppLogger;
  prices: PlanPrices;
  trialDays: number;
  planUrl: string;
  subscriptions?: SubscriptionRepository;
  payments?: PaymentRepository;
}

const HOUR_MS = 60 * 60 * 1000;

// Composition Root, Abstract Factory
export class SubscriptionsModule implements AppModule, SubscriptionPresenterFactory {
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
    );
  }

  registerContracts(registry: ContractRegistry): void {
    registerSubscriptionContracts(registry);
  }

  createRouter(): Router {
    return new SubscriptionRoutes(this, this.deps.guard).build();
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

  getSubscription(view: View<SubscriptionDetailDto>): GetSubscriptionPresenter {
    return new GetSubscriptionPresenter(view, this.#service);
  }

  choosePlan(view: View<SubscriptionDetailDto>): ChoosePlanPresenter {
    return new ChoosePlanPresenter(view, this.#service);
  }

  addPaymentMethod(view: View<SubscriptionDetailDto>): AddPaymentMethodPresenter {
    return new AddPaymentMethodPresenter(view, this.#service);
  }

  updatePaymentMethod(view: View<SubscriptionDetailDto>): UpdatePaymentMethodPresenter {
    return new UpdatePaymentMethodPresenter(view, this.#service);
  }

  removePaymentMethod(view: View<SubscriptionDetailDto>): RemovePaymentMethodPresenter {
    return new RemovePaymentMethodPresenter(view, this.#service);
  }

  setAutoDebit(view: View<SubscriptionDetailDto>): SetAutoDebitPresenter {
    return new SetAutoDebitPresenter(view, this.#service);
  }

  cancelSubscription(view: View<SubscriptionDetailDto>): CancelSubscriptionPresenter {
    return new CancelSubscriptionPresenter(view, this.#service);
  }

  listPayments(view: View<PaymentDto[]>): ListPaymentsPresenter {
    return new ListPaymentsPresenter(view, this.#service);
  }

  registerManualPayment(view: View<PaymentDto>): RegisterManualPaymentPresenter {
    return new RegisterManualPaymentPresenter(view, this.#service);
  }
}
