import type { ProfessionalDirectory } from '#modules/auth';
import type { SubscriptionAccess } from '#modules/subscriptions';
import { PracticeDirectory, type PracticeProfile } from '../model/PracticeDirectory';

// Adapter
export class AuthPracticeDirectory extends PracticeDirectory {
  constructor(
    private readonly professionals: ProfessionalDirectory,
    private readonly access: SubscriptionAccess,
  ) {
    super();
  }

  async profile(professionalId: string): Promise<PracticeProfile | null> {
    const profile = await this.professionals.publicProfile(professionalId);
    return profile
      ? { fullName: profile.fullName, specialty: profile.specialty, offices: profile.offices }
      : null;
  }

  async hasAccess(professionalId: string): Promise<boolean> {
    return (await this.access.accessOf(professionalId))?.hasAccess ?? false;
  }
}
