import {
  ConflictError,
  NotFoundError,
  PaymentDeclinedError,
  ServiceUnavailableError,
  ValidationError,
} from '#core/errors/ApplicationError';
import type { Clock } from '#core/model/Clock';
import type { IdGenerator } from '#core/model/IdGenerator';
import type { TransactionManager } from '#core/model/TransactionManager';
import type { BillingEvent, BillingNotifier } from './BillingNotifier';
import { type ManualPaymentMethod, Payment, type PaymentKind } from './Payment';
import type { CardDetails, ChargeResult, PaymentGateway } from './PaymentGateway';
import { PaymentMethod } from './PaymentMethod';
import type { PaymentRepository } from './PaymentRepository';
import type { Plan, PlanCatalog } from './Plan';
import { MAX_FAILED_CHARGES, type Subscription } from './Subscription';
import type { SubscriptionRepository } from './SubscriptionRepository';

export interface ManualPaymentData {
  amount: number;
  paidAt: Date;
  method: ManualPaymentMethod;
  reference: string | null;
}

export interface PaymentMethodChanges {
  holderName?: string;
  expMonth?: number;
  expYear?: number;
  makeDefault?: boolean;
}

interface PendingCharge {
  plan: Plan;
  method: PaymentMethod;
  idempotencyKey: string;
}

const RENEWAL_BATCH = 100;
const PAYMENT_HISTORY_LIMIT = 100;

export interface RenewalReport {
  processed: number;
  failed: number;
  errors: { professionalId: string; error: unknown }[];
}

export class SubscriptionService {
  constructor(
    private readonly subscriptions: SubscriptionRepository,
    private readonly payments: PaymentRepository,
    private readonly transactions: TransactionManager,
    private readonly gateway: PaymentGateway,
    private readonly notifier: BillingNotifier,
    private readonly catalog: PlanCatalog,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
  ) {}

  get now(): Date {
    return this.clock.now();
  }

  get plans(): Plan[] {
    return this.catalog.all();
  }

  planOf(subscription: Subscription): Plan | null {
    return subscription.planId ? this.catalog.get(subscription.planId) : null;
  }

  async get(professionalId: string): Promise<Subscription> {
    const subscription = await this.subscriptions.findById(professionalId);
    if (!subscription) {
      throw new NotFoundError('Subscription', professionalId);
    }
    return subscription;
  }

  async choosePlan(professionalId: string, planId: string): Promise<Subscription> {
    const plan = this.catalog.get(planId);
    const pending = await this.transactions.run(async () => {
      const subscription = await this.get(professionalId);
      if (!subscription.choosePlan(plan, this.now)) {
        await this.subscriptions.save(subscription);
        return null;
      }
      const method = subscription.defaultPaymentMethod;
      if (!method) {
        throw new ConflictError(
          'Register a payment method to activate the plan',
          { field: 'paymentMethod' },
          'PAYMENT_METHOD_REQUIRED',
        );
      }
      const attempt = await this.payments.countByProfessional(professionalId);
      const idempotencyKey = `plan:${professionalId}:${plan.id}:${method.id}:${attempt}`;
      return { plan, method, idempotencyKey };
    });
    if (!pending) {
      return this.get(professionalId);
    }

    const result = await this.charge(pending, `Mentora ${plan.name} plan`);
    const subscription = await this.transactions.run(async () => {
      const current = await this.get(professionalId);
      if (await this.payments.hasChargeKey(pending.idempotencyKey)) {
        return current;
      }
      await this.payments.save(this.chargedPayment(current, pending, 'plan_change', result));
      if (result.outcome === 'approved') {
        current.applyPayment(pending.plan, this.now);
        await this.subscriptions.save(current);
      }
      return current;
    });
    SubscriptionService.assertApproved(result);
    return subscription;
  }

  async addPaymentMethod(
    professionalId: string,
    card: CardDetails,
    makeDefault: boolean,
  ): Promise<Subscription> {
    PaymentMethod.assertValidExpiry(card.expMonth, card.expYear, this.now);
    const tokenized = await this.gateway.tokenizeCard(card);
    return this.transactions.run(async () => {
      const subscription = await this.get(professionalId);
      const method = PaymentMethod.register(
        this.ids.next(),
        {
          brand: tokenized.brand,
          last4: tokenized.last4,
          expMonth: card.expMonth,
          expYear: card.expYear,
          holderName: card.holderName,
          gatewayToken: tokenized.token,
          addedAt: this.now,
        },
        this.now,
      );
      subscription.addPaymentMethod(method, makeDefault, this.now);
      await this.subscriptions.save(subscription);
      return subscription;
    });
  }

  updatePaymentMethod(
    professionalId: string,
    methodId: string,
    changes: PaymentMethodChanges,
  ): Promise<Subscription> {
    return this.mutate(professionalId, (s) => s.updatePaymentMethod(methodId, changes, this.now));
  }

  removePaymentMethod(
    professionalId: string,
    methodId: string,
    confirmed: boolean,
  ): Promise<Subscription> {
    return this.mutate(professionalId, (s) => s.removePaymentMethod(methodId, confirmed, this.now));
  }

  setAutoDebit(professionalId: string, enabled: boolean): Promise<Subscription> {
    return this.mutate(professionalId, (s) => s.setAutoDebit(enabled, this.now));
  }

  cancel(professionalId: string): Promise<Subscription> {
    return this.mutate(professionalId, (s) => s.cancel(this.now));
  }

  registerManualPayment(professionalId: string, data: ManualPaymentData): Promise<Payment> {
    return this.transactions.run(async () => {
      const subscription = await this.get(professionalId);
      const plan = this.planOf(subscription);
      if (!plan) {
        throw new ValidationError('Choose a plan before registering a payment', {
          field: 'planId',
        });
      }
      if (data.amount < plan.price) {
        throw new ValidationError(
          `The ${plan.name} plan costs ${plan.price} ${plan.currency}; the amount is not enough`,
          { field: 'amount' },
        );
      }
      subscription.assertAcceptsManualPayment(data.paidAt, this.now);
      if (
        data.reference &&
        (await this.payments.hasManualReference(professionalId, data.reference))
      ) {
        throw new ConflictError(
          'A payment with this reference is already registered',
          { field: 'reference' },
          'DUPLICATE_PAYMENT_REFERENCE',
        );
      }
      const payment = Payment.manual(
        this.ids.next(),
        {
          professionalId,
          planId: plan.id,
          amount: data.amount,
          currency: plan.currency,
          method: data.method,
          reference: data.reference,
          paidAt: data.paidAt,
        },
        this.now,
      );
      subscription.applyPayment(plan, this.now);
      await this.payments.save(payment);
      await this.subscriptions.save(subscription);
      return payment;
    });
  }

  listPayments(professionalId: string): Promise<Payment[]> {
    return this.payments.findByProfessional(professionalId, PAYMENT_HISTORY_LIMIT);
  }

  async processDueRenewals(): Promise<RenewalReport> {
    const due = await this.subscriptions.findDue(this.now, RENEWAL_BATCH);
    const errors: RenewalReport['errors'] = [];
    let failed = 0;
    for (const subscription of due) {
      try {
        await this.renew(subscription.professionalId);
      } catch (error) {
        failed += 1;
        errors.push({ professionalId: subscription.professionalId, error });
      }
    }
    return { processed: due.length, failed, errors };
  }

  private async renew(professionalId: string): Promise<void> {
    const decision = await this.transactions.run(async () => {
      const subscription = await this.get(professionalId);
      const now = this.now;
      if (!subscription.isDueAt(now)) {
        return null;
      }
      const plan = this.planOf(subscription);
      if (!plan) {
        subscription.expireTrial(now);
        await this.subscriptions.save(subscription);
        return {
          kind: 'settled' as const,
          event: { type: 'trial_expired' } as BillingEvent,
          subscription,
        };
      }
      const method = subscription.defaultPaymentMethod;
      if (!subscription.autoDebit || !method) {
        subscription.markPaymentPending(now);
        await this.subscriptions.save(subscription);
        const reason = method ? 'automatic debit is off' : 'there is no payment method';
        const event: BillingEvent = { type: 'payment_pending', reason };
        return { kind: 'settled' as const, event, subscription };
      }
      const key = `renewal:${professionalId}:${subscription.periodEndsAt.toISOString()}:${subscription.failedChargeAttempts}`;
      const charge: PendingCharge = { plan, method, idempotencyKey: key };
      return { kind: 'charge' as const, charge, subscription };
    });
    if (!decision) {
      return;
    }
    if (decision.kind === 'settled') {
      await this.safeNotify(decision.subscription, decision.event);
      return;
    }

    const pending = decision.charge;
    const result = await this.charge(pending, `Mentora ${pending.plan.name} plan renewal`);
    const outcome = await this.transactions.run(async () => {
      const subscription = await this.get(professionalId);
      if (await this.payments.hasChargeKey(pending.idempotencyKey)) {
        return { subscription, event: null };
      }
      const now = this.now;
      await this.payments.save(this.chargedPayment(subscription, pending, 'automatic', result));
      let event: BillingEvent | null = null;
      if (result.outcome === 'approved') {
        subscription.applyPayment(pending.plan, now);
        event = {
          type: 'renewed',
          planName: pending.plan.name,
          amount: pending.plan.price,
          currency: pending.plan.currency,
          periodEndsAt: subscription.periodEndsAt,
        };
      } else if (result.outcome === 'declined') {
        subscription.markPaymentPending(now);
        event = { type: 'payment_declined', reason: result.reason };
      } else {
        subscription.recordFailedCharge(now);
        if (subscription.phase === 'suspended') {
          event = {
            type: 'suspended',
            reason: `${MAX_FAILED_CHARGES} charge attempts failed: ${result.reason}`,
          };
        }
      }
      await this.subscriptions.save(subscription);
      return { subscription, event };
    });
    if (outcome.event) {
      await this.safeNotify(outcome.subscription, outcome.event);
    }
  }

  private async charge(pending: PendingCharge, description: string): Promise<ChargeResult> {
    try {
      return await this.gateway.charge({
        token: pending.method.gatewayToken,
        amount: pending.plan.price,
        currency: pending.plan.currency,
        description,
        idempotencyKey: pending.idempotencyKey,
      });
    } catch (error) {
      return { outcome: 'error', reason: error instanceof Error ? error.message : 'unknown' };
    }
  }

  private chargedPayment(
    subscription: Subscription,
    pending: PendingCharge,
    kind: PaymentKind,
    result: ChargeResult,
  ): Payment {
    return Payment.charged(
      this.ids.next(),
      {
        professionalId: subscription.professionalId,
        planId: pending.plan.id,
        amount: pending.plan.price,
        currency: pending.plan.currency,
        kind,
        status: result.outcome === 'error' ? 'failed' : result.outcome,
        methodLabel: pending.method.label,
        reference: result.outcome === 'approved' ? result.reference : null,
        chargeKey: pending.idempotencyKey,
        failureReason: result.outcome === 'approved' ? null : result.reason,
      },
      this.now,
    );
  }

  private static assertApproved(result: ChargeResult): void {
    if (result.outcome === 'declined') {
      throw new PaymentDeclinedError(`The payment was declined: ${result.reason}`, {
        field: 'paymentMethod',
      });
    }
    if (result.outcome === 'error') {
      throw new ServiceUnavailableError(
        'The payment provider is not available. Try again in a few minutes.',
        'PAYMENT_PROVIDER_UNAVAILABLE',
      );
    }
  }

  private mutate(
    professionalId: string,
    change: (subscription: Subscription) => void,
  ): Promise<Subscription> {
    return this.transactions.run(async () => {
      const subscription = await this.get(professionalId);
      change(subscription);
      await this.subscriptions.save(subscription);
      return subscription;
    });
  }

  private async safeNotify(subscription: Subscription, event: BillingEvent): Promise<void> {
    try {
      await this.notifier.notify(subscription.contact, event);
    } catch {}
  }
}
