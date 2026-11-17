import { ValidationError } from '#core/errors/ApplicationError';
import type { Clock } from '#core/model/Clock';
import type { IdGenerator } from '#core/model/IdGenerator';
import type { TransactionManager } from '#core/model/TransactionManager';
import type { PasswordHasher } from '#core/security/PasswordHasher';
import { PasswordPolicy } from './PasswordPolicy';
import { PasswordRecovery } from './PasswordRecovery';
import type { PasswordRecoveryNotifier, RecoveryCodeMessage } from './PasswordRecoveryNotifier';
import type { PasswordRecoveryRepository } from './PasswordRecoveryRepository';
import { Professional } from './Professional';
import type { ProfessionalRepository } from './ProfessionalRepository';
import type { RecoveryCodeGenerator } from './RecoveryCodeGenerator';

const INVALID_CODE = 'The code is incorrect or has expired. Check it or request a new one.';

export class PasswordRecoveryService {
  constructor(
    private readonly professionals: ProfessionalRepository,
    private readonly recoveries: PasswordRecoveryRepository,
    private readonly codes: RecoveryCodeGenerator,
    private readonly hasher: PasswordHasher,
    private readonly notifier: PasswordRecoveryNotifier,
    private readonly transactions: TransactionManager,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
  ) {}

  async request(email: string): Promise<void> {
    const code = this.codes.generate();
    const codeHash = await this.hasher.hash(code);
    const message = await this.transactions.run(async (): Promise<RecoveryCodeMessage | null> => {
      const professional = await this.professionals.findByEmail(Professional.normalizeEmail(email));
      if (!professional) {
        return null;
      }
      const now = this.clock.now();
      const previous = await this.recoveries.findLatestUnused(professional.id);
      if (previous) {
        previous.invalidate(now);
        await this.recoveries.save(previous);
      }
      const recovery = PasswordRecovery.issue(this.ids.next(), professional.id, codeHash, now);
      await this.recoveries.save(recovery);
      return {
        email: professional.email,
        name: professional.firstName,
        code,
        expiresAt: recovery.expiresAt,
      };
    });
    if (message) {
      void this.notifier.sendCode(message).catch(() => undefined);
    }
  }

  async verify(email: string, code: string): Promise<void> {
    const valid = await this.transactions.run(async () => (await this.check(email, code)) !== null);
    if (!valid) {
      throw PasswordRecoveryService.invalidCode();
    }
  }

  async reset(email: string, code: string, newPassword: string): Promise<void> {
    PasswordPolicy.assertSatisfiedBy(newPassword, 'newPassword');
    const hash = await this.hasher.hash(newPassword);
    const changed = await this.transactions.run(async () => {
      const checked = await this.check(email, code);
      if (!checked) {
        return false;
      }
      const now = this.clock.now();
      checked.recovery.invalidate(now);
      checked.professional.changePasswordHash(hash, now);
      await this.recoveries.save(checked.recovery);
      await this.professionals.save(checked.professional);
      return true;
    });
    if (!changed) {
      throw PasswordRecoveryService.invalidCode();
    }
  }

  private async check(
    email: string,
    code: string,
  ): Promise<{ professional: Professional; recovery: PasswordRecovery } | null> {
    const professional = await this.professionals.findByEmail(Professional.normalizeEmail(email));
    const recovery = professional ? await this.recoveries.findLatestUnused(professional.id) : null;
    if (!professional || !recovery?.isUsableAt(this.clock.now())) {
      return null;
    }
    if (!(await this.hasher.verify(code.trim(), recovery.codeHash))) {
      recovery.recordFailedAttempt();
      await this.recoveries.save(recovery);
      return null;
    }
    return { professional, recovery };
  }

  static invalidCode(): ValidationError {
    return new ValidationError(INVALID_CODE, { field: 'code' }, 'INVALID_RECOVERY_CODE');
  }
}
