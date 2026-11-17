export type AccessStatus =
  | 'trial'
  | 'active'
  | 'pending_payment'
  | 'suspended'
  | 'cancelled'
  | 'expired';

export interface AccessState {
  status: AccessStatus;
  hasAccess: boolean;
  accessEndsAt: Date;
  daysLeft: number;
}

export interface ProfessionalContact {
  email: string;
  name: string;
}

export abstract class ProfessionalAccess {
  abstract startTrial(professionalId: string, contact: ProfessionalContact): Promise<AccessState>;
  abstract accessOf(professionalId: string): Promise<AccessState | null>;
  abstract updateContact(professionalId: string, contact: ProfessionalContact): Promise<void>;
}
