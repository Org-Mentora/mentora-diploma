import type { AppLogger } from '#core/logging/AppLogger';
import type { LegacyPlan, SubscriptionAccess } from '#modules/subscriptions';
import { ProfessionalModel } from './ProfessionalSchema';

interface LegacyProfessional {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  subscription: { plan: LegacyPlan; endsAt: Date | null };
}

export class LegacySubscriptionMigration {
  constructor(
    private readonly subscriptions: SubscriptionAccess,
    private readonly logger: AppLogger,
  ) {}

  async run(): Promise<number> {
    const legacy = await ProfessionalModel.collection
      .find<LegacyProfessional>({ subscription: { $exists: true } })
      .toArray();
    for (const professional of legacy) {
      await this.subscriptions.importLegacy(
        professional._id,
        { email: professional.email, name: `${professional.firstName} ${professional.lastName}` },
        professional.subscription.plan,
        professional.subscription.endsAt,
      );
      await ProfessionalModel.collection.updateOne({ _id: professional._id } as never, {
        $unset: { subscription: '' },
      });
    }
    if (legacy.length > 0) {
      this.logger.info('Migrated legacy subscriptions', { count: legacy.length });
    }
    return legacy.length;
  }
}
