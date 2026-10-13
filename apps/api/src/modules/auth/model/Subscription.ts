import { ValueObject } from '#core/model/ValueObject';

/** `trial` is the only plan in the MVP; `paid` is reserved for CU-18. */
export type SubscriptionPlan = 'trial' | 'paid';
export type SubscriptionStatus = 'trial' | 'active' | 'expired';

interface SubscriptionProps {
  plan: SubscriptionPlan;
  /** End of the paid or trial period; `null` for an open-ended paid plan. */
  endsAt: Date | null;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** The professional's access to the system (CU-03 free trial, CU-01 step 7 check). */
export class Subscription extends ValueObject<SubscriptionProps> {
  static startTrial(now: Date, days: number): Subscription {
    return new Subscription({ plan: 'trial', endsAt: new Date(now.getTime() + days * DAY_MS) });
  }

  static restore(plan: SubscriptionPlan, endsAt: Date | null): Subscription {
    return new Subscription({ plan, endsAt });
  }

  get plan(): SubscriptionPlan {
    return this.props.plan;
  }

  /** When access ends, used to stamp session tokens. */
  get accessEndsAt(): Date | null {
    return this.props.endsAt;
  }

  statusAt(now: Date): SubscriptionStatus {
    if (this.props.endsAt && this.props.endsAt.getTime() <= now.getTime()) {
      return 'expired';
    }
    return this.props.plan === 'trial' ? 'trial' : 'active';
  }

  allowsAccessAt(now: Date): boolean {
    return this.statusAt(now) !== 'expired';
  }

  /** Whole days of access left (rounded up), or `null` without an end date. */
  daysLeftAt(now: Date): number | null {
    if (!this.props.endsAt) {
      return null;
    }
    return Math.max(0, Math.ceil((this.props.endsAt.getTime() - now.getTime()) / DAY_MS));
  }
}
