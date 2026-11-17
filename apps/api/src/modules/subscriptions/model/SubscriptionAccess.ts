import type { Clock } from '#core/model/Clock';
import { type BillingContact, Subscription, type SubscriptionStatus } from './Subscription';
import type { SubscriptionRepository } from './SubscriptionRepository';

export interface AccessSummary {
  status: SubscriptionStatus;
  hasAccess: boolean;
  accessEndsAt: Date;
  daysLeft: number;
}

export type LegacyPlan = 'trial' | 'paid';

export class SubscriptionAccess {
  constructor(
    private readonly subscriptions: SubscriptionRepository,
    private readonly clock: Clock,
    private readonly trialDays: number,
  ) {}

  async startTrial(professionalId: string, contact: BillingContact): Promise<AccessSummary> {
    const subscription = Subscription.startTrial(
      professionalId,
      contact,
      this.clock.now(),
      this.trialDays,
    );
    await this.subscriptions.save(subscription);
    return this.summarize(subscription);
  }

  async accessOf(professionalId: string): Promise<AccessSummary | null> {
    const subscription = await this.subscriptions.findById(professionalId);
    return subscription ? this.summarize(subscription) : null;
  }

  async updateContact(professionalId: string, contact: BillingContact): Promise<void> {
    const subscription = await this.subscriptions.findById(professionalId);
    if (subscription) {
      subscription.updateContact(contact, this.clock.now());
      await this.subscriptions.save(subscription);
    }
  }

  async importLegacy(
    professionalId: string,
    contact: BillingContact,
    plan: LegacyPlan,
    endsAt: Date | null,
  ): Promise<void> {
    if (await this.subscriptions.findById(professionalId)) {
      return;
    }
    await this.subscriptions.save(
      Subscription.migrate(professionalId, contact, plan, endsAt, this.clock.now()),
    );
  }

  private summarize(subscription: Subscription): AccessSummary {
    const now = this.clock.now();
    return {
      status: subscription.statusAt(now),
      hasAccess: subscription.hasAccessAt(now),
      accessEndsAt: subscription.periodEndsAt,
      daysLeft: subscription.daysLeftAt(now),
    };
  }
}
