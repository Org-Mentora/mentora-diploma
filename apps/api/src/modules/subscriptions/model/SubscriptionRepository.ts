import { Repository } from '#core/model/Repository';
import type { Subscription } from './Subscription';

// Repository
export abstract class SubscriptionRepository extends Repository<Subscription> {
  abstract findDue(now: Date, limit: number): Promise<Subscription[]>;
}
