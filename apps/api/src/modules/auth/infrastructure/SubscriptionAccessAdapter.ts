import type { SubscriptionAccess } from '#modules/subscriptions';
import {
  type AccessState,
  ProfessionalAccess,
  type ProfessionalContact,
} from '../model/ProfessionalAccess';

// Adapter
export class SubscriptionAccessAdapter extends ProfessionalAccess {
  constructor(private readonly subscriptions: SubscriptionAccess) {
    super();
  }

  startTrial(professionalId: string, contact: ProfessionalContact): Promise<AccessState> {
    return this.subscriptions.startTrial(professionalId, contact);
  }

  accessOf(professionalId: string): Promise<AccessState | null> {
    return this.subscriptions.accessOf(professionalId);
  }

  updateContact(professionalId: string, contact: ProfessionalContact): Promise<void> {
    return this.subscriptions.updateContact(professionalId, contact);
  }
}
