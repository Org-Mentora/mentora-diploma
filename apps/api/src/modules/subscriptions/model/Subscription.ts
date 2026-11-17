import { ConflictError, ValidationError } from '#core/errors/ApplicationError';
import { Entity } from '#core/model/Entity';
import type { PaymentMethod } from './PaymentMethod';
import type { Plan, PlanId } from './Plan';

export type SubscriptionStatus =
  | 'trial'
  | 'active'
  | 'pending_payment'
  | 'suspended'
  | 'cancelled'
  | 'expired';

export type SubscriptionPhase = Exclude<SubscriptionStatus, 'cancelled'>;

export interface BillingContact {
  email: string;
  name: string;
}

export interface SubscriptionProps {
  contact: BillingContact;
  phase: SubscriptionPhase;
  planId: PlanId | null;
  periodEndsAt: Date;
  autoDebit: boolean;
  paymentMethods: PaymentMethod[];
  defaultPaymentMethodId: string | null;
  failedChargeAttempts: number;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_PAYMENT_METHODS = 5;
export const MAX_FAILED_CHARGES = 3;
export const MANUAL_PAYMENT_MAX_AGE_DAYS = 30;
export const MANUAL_PAYMENT_WINDOW_DAYS = 7;

// Aggregate Root, State
export class Subscription extends Entity<SubscriptionProps> {
  static startTrial(
    professionalId: string,
    contact: BillingContact,
    now: Date,
    trialDays: number,
  ): Subscription {
    return new Subscription(professionalId, {
      contact,
      phase: 'trial',
      planId: null,
      periodEndsAt: new Date(now.getTime() + trialDays * DAY_MS),
      autoDebit: false,
      paymentMethods: [],
      defaultPaymentMethodId: null,
      failedChargeAttempts: 0,
      cancelledAt: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static migrate(
    professionalId: string,
    contact: BillingContact,
    legacyPlan: 'trial' | 'paid',
    endsAt: Date | null,
    now: Date,
  ): Subscription {
    const paid = legacyPlan === 'paid';
    return new Subscription(professionalId, {
      contact,
      phase: paid ? 'active' : 'trial',
      planId: paid ? 'monthly' : null,
      periodEndsAt: endsAt ?? now,
      autoDebit: false,
      paymentMethods: [],
      defaultPaymentMethodId: null,
      failedChargeAttempts: 0,
      cancelledAt: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static restore(professionalId: string, props: SubscriptionProps): Subscription {
    return new Subscription(professionalId, props);
  }

  statusAt(now: Date): SubscriptionStatus {
    if (this.props.cancelledAt) {
      return 'cancelled';
    }
    const lapsed = this.hasLapsedAt(now);
    switch (this.props.phase) {
      case 'trial':
        if (!lapsed) {
          return 'trial';
        }
        return this.props.planId ? 'pending_payment' : 'expired';
      case 'active':
        return lapsed ? 'pending_payment' : 'active';
      default:
        return this.props.phase;
    }
  }

  hasAccessAt(now: Date): boolean {
    return (
      !this.hasLapsedAt(now) && (this.props.phase === 'trial' || this.props.phase === 'active')
    );
  }

  daysLeftAt(now: Date): number {
    return Math.max(0, Math.ceil((this.props.periodEndsAt.getTime() - now.getTime()) / DAY_MS));
  }

  isDueAt(now: Date): boolean {
    return (
      this.props.cancelledAt === null &&
      this.hasLapsedAt(now) &&
      (this.props.phase === 'trial' || this.props.phase === 'active')
    );
  }

  choosePlan(plan: Plan, now: Date): boolean {
    if (!this.hasAccessAt(now)) {
      return true;
    }
    this.props = { ...this.props, planId: plan.id, cancelledAt: null, updatedAt: now };
    return false;
  }

  applyPayment(plan: Plan, now: Date): void {
    const start = this.hasLapsedAt(now) ? now : this.props.periodEndsAt;
    this.props = {
      ...this.props,
      phase: 'active',
      planId: plan.id,
      periodEndsAt: plan.periodEndFrom(start),
      failedChargeAttempts: 0,
      cancelledAt: null,
      updatedAt: now,
    };
  }

  expireTrial(now: Date): void {
    this.setPhase('expired', now);
  }

  markPaymentPending(now: Date): void {
    this.setPhase('pending_payment', now);
  }

  recordFailedCharge(now: Date): void {
    const failedChargeAttempts = this.props.failedChargeAttempts + 1;
    this.props = { ...this.props, failedChargeAttempts, updatedAt: now };
    if (failedChargeAttempts >= MAX_FAILED_CHARGES) {
      this.setPhase('suspended', now);
    }
  }

  addPaymentMethod(method: PaymentMethod, makeDefault: boolean, now: Date): void {
    if (this.props.paymentMethods.length >= MAX_PAYMENT_METHODS) {
      throw new ValidationError(`You can register up to ${MAX_PAYMENT_METHODS} payment methods`, {
        field: 'cardNumber',
      });
    }
    const isFirst = this.props.paymentMethods.length === 0;
    this.props = {
      ...this.props,
      paymentMethods: [...this.props.paymentMethods, method],
      defaultPaymentMethodId:
        makeDefault || isFirst ? method.id : this.props.defaultPaymentMethodId,
      updatedAt: now,
    };
  }

  updatePaymentMethod(
    methodId: string,
    changes: { holderName?: string; expMonth?: number; expYear?: number; makeDefault?: boolean },
    now: Date,
  ): void {
    const current = this.findPaymentMethod(methodId);
    const updated = current.withChanges(changes, now);
    this.props = {
      ...this.props,
      paymentMethods: this.props.paymentMethods.map((m) => (m.id === methodId ? updated : m)),
      defaultPaymentMethodId: changes.makeDefault ? methodId : this.props.defaultPaymentMethodId,
      updatedAt: now,
    };
  }

  removePaymentMethod(methodId: string, confirmed: boolean, now: Date): void {
    this.findPaymentMethod(methodId);
    const remaining = this.props.paymentMethods.filter((m) => m.id !== methodId);
    if (remaining.length === 0 && this.props.autoDebit && !confirmed) {
      throw new ConflictError(
        'This is the only card used for automatic debit. Renewals will not be charged until you add another one.',
        { field: 'confirm' },
        'CONFIRMATION_REQUIRED',
      );
    }
    const defaultPaymentMethodId =
      this.props.defaultPaymentMethodId === methodId
        ? (remaining[0]?.id ?? null)
        : this.props.defaultPaymentMethodId;
    this.props = {
      ...this.props,
      paymentMethods: remaining,
      defaultPaymentMethodId,
      autoDebit: remaining.length > 0 && this.props.autoDebit,
      updatedAt: now,
    };
  }

  setAutoDebit(enabled: boolean, now: Date): void {
    if (enabled && !this.defaultPaymentMethod) {
      throw new ValidationError('Register a payment method before enabling automatic debit', {
        field: 'enabled',
      });
    }
    this.props = { ...this.props, autoDebit: enabled, updatedAt: now };
  }

  cancel(now: Date): void {
    if (this.props.cancelledAt) {
      throw new ConflictError('The subscription is already cancelled');
    }
    this.props = { ...this.props, cancelledAt: now, updatedAt: now };
  }

  assertAcceptsManualPayment(paidAt: Date, now: Date): void {
    if (paidAt.getTime() > now.getTime()) {
      throw new ValidationError('The payment date cannot be in the future', { field: 'paidAt' });
    }
    const oldest = Math.max(
      now.getTime() - MANUAL_PAYMENT_MAX_AGE_DAYS * DAY_MS,
      this.props.createdAt.getTime(),
    );
    if (paidAt.getTime() < oldest) {
      throw new ValidationError(
        `Only payments made in the last ${MANUAL_PAYMENT_MAX_AGE_DAYS} days, after the account was created, can be registered`,
        { field: 'paidAt' },
      );
    }
    const opensAt = this.props.periodEndsAt.getTime() - MANUAL_PAYMENT_WINDOW_DAYS * DAY_MS;
    if (this.hasAccessAt(now) && now.getTime() < opensAt) {
      throw new ConflictError(
        `Your access is covered until ${this.props.periodEndsAt.toISOString().slice(0, 10)}. Manual payments can be registered from ${MANUAL_PAYMENT_WINDOW_DAYS} days before it ends.`,
        { field: 'paidAt' },
        'PAYMENT_NOT_DUE',
      );
    }
  }

  updateContact(contact: BillingContact, now: Date): void {
    this.props = { ...this.props, contact, updatedAt: now };
  }

  private hasLapsedAt(now: Date): boolean {
    return this.props.periodEndsAt.getTime() <= now.getTime();
  }

  private setPhase(phase: SubscriptionPhase, now: Date): void {
    this.props = { ...this.props, phase, updatedAt: now };
  }

  private findPaymentMethod(methodId: string): PaymentMethod {
    const method = this.props.paymentMethods.find((m) => m.id === methodId);
    if (!method) {
      throw new ValidationError('Payment method not found', { field: 'paymentMethodId' });
    }
    return method;
  }

  get professionalId(): string {
    return this.id;
  }

  get contact(): BillingContact {
    return this.props.contact;
  }

  get phase(): SubscriptionPhase {
    return this.props.phase;
  }

  get planId(): PlanId | null {
    return this.props.planId;
  }

  get periodEndsAt(): Date {
    return this.props.periodEndsAt;
  }

  get autoDebit(): boolean {
    return this.props.autoDebit;
  }

  get renewsAutomatically(): boolean {
    return this.props.autoDebit && this.props.cancelledAt === null;
  }

  get paymentMethods(): readonly PaymentMethod[] {
    return this.props.paymentMethods;
  }

  get defaultPaymentMethodId(): string | null {
    return this.props.defaultPaymentMethodId;
  }

  get defaultPaymentMethod(): PaymentMethod | null {
    return (
      this.props.paymentMethods.find((m) => m.id === this.props.defaultPaymentMethodId) ?? null
    );
  }

  get failedChargeAttempts(): number {
    return this.props.failedChargeAttempts;
  }

  get cancelledAt(): Date | null {
    return this.props.cancelledAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
