import { Repository } from '#core/model/Repository';
import type { PasswordRecovery } from './PasswordRecovery';

// Repository
export abstract class PasswordRecoveryRepository extends Repository<PasswordRecovery> {
  abstract findLatestUnused(professionalId: string): Promise<PasswordRecovery | null>;
}
