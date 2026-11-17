import type { BillingContact } from './Subscription';

export type BillingEvent =
  | { type: 'trial_expired' }
  | { type: 'payment_pending'; reason: string }
  | { type: 'payment_declined'; reason: string }
  | { type: 'suspended'; reason: string }
  | { type: 'renewed'; planName: string; amount: number; currency: string; periodEndsAt: Date };

export abstract class BillingNotifier {
  abstract notify(contact: BillingContact, event: BillingEvent): Promise<void>;
}
