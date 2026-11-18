import { MongooseRepository } from '#infrastructure/database/MongooseRepository';
import type { TransactionContext } from '#infrastructure/database/TransactionContext';
import type { Subscription } from '../model/Subscription';
import type { SubscriptionRepository } from '../model/SubscriptionRepository';
import { SubscriptionMapper } from './SubscriptionMapper';
import { type SubscriptionDocument, SubscriptionModel } from './SubscriptionSchema';

// Repository, Adapter
export class MongooseSubscriptionRepository
  extends MongooseRepository<Subscription, SubscriptionDocument>
  implements SubscriptionRepository
{
  constructor(context: TransactionContext) {
    super(SubscriptionModel, new SubscriptionMapper(), context);
  }

  async findDue(now: Date, limit: number): Promise<Subscription[]> {
    return this.findManyBy(
      { phase: { $in: ['trial', 'active'] }, cancelledAt: null, periodEndsAt: { $lte: now } },
      { sort: { periodEndsAt: 1 }, limit },
    );
  }
}
