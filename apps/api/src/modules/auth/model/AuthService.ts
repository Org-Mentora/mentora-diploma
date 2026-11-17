import { ConflictError, UnauthorizedError, ValidationError } from '#core/errors/ApplicationError';
import type { Clock } from '#core/model/Clock';
import type { TransactionManager } from '#core/model/TransactionManager';
import type { PasswordHasher } from '#core/security/PasswordHasher';
import type { TokenService } from '#core/security/TokenService';
import { PasswordPolicy } from './PasswordPolicy';
import { Professional, type ProfessionalProfile } from './Professional';
import type { AccessState, ProfessionalAccess } from './ProfessionalAccess';
import type { ProfessionalRepository } from './ProfessionalRepository';

export interface RegisterProfessionalData extends ProfessionalProfile {
  password: string;
}

export interface SessionSubject {
  professional: Professional;
  access: AccessState;
}

const NO_ACCESS: AccessState = {
  status: 'expired',
  hasAccess: false,
  accessEndsAt: new Date(0),
  daysLeft: 0,
};

export class AuthService {
  constructor(
    private readonly professionals: ProfessionalRepository,
    private readonly access: ProfessionalAccess,
    private readonly transactions: TransactionManager,
    private readonly hasher: PasswordHasher,
    private readonly tokens: TokenService,
    private readonly clock: Clock,
  ) {}

  get now(): Date {
    return this.clock.now();
  }

  async register(data: RegisterProfessionalData): Promise<SessionSubject> {
    PasswordPolicy.assertSatisfiedBy(data.password);
    const passwordHash = await this.hasher.hash(data.password);
    return this.transactions.run(async () => {
      const professional = Professional.register({ ...data, passwordHash }, this.clock.now());
      await this.assertUnique(professional.email, professional.licenseNumber);
      await this.professionals.save(professional);
      const access = await this.access.startTrial(
        professional.id,
        AuthService.contactOf(professional),
      );
      return { professional, access };
    });
  }

  async authenticate(email: string, password: string): Promise<SessionSubject> {
    const professional = await this.professionals.findByEmail(Professional.normalizeEmail(email));
    const valid = professional && (await this.hasher.verify(password, professional.passwordHash));
    if (!professional || !valid) {
      throw new UnauthorizedError('Invalid email or password');
    }
    return this.subject(professional);
  }

  async getSession(professionalId: string, credentialsVersion?: number): Promise<SessionSubject> {
    const professional = await this.getProfessional(professionalId);
    if (
      credentialsVersion !== undefined &&
      credentialsVersion !== professional.credentialsVersion
    ) {
      throw new UnauthorizedError('Your password was changed. Log in again.');
    }
    return this.subject(professional);
  }

  async getProfessional(professionalId: string): Promise<Professional> {
    const professional = await this.professionals.findById(professionalId);
    if (!professional) {
      throw new UnauthorizedError('Your account no longer exists');
    }
    return professional;
  }

  async changePassword(
    professionalId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<SessionSubject> {
    const professional = await this.getProfessional(professionalId);
    if (!(await this.hasher.verify(currentPassword, professional.passwordHash))) {
      throw new ValidationError(
        'The current password is incorrect',
        { field: 'currentPassword' },
        'INVALID_CURRENT_PASSWORD',
      );
    }
    PasswordPolicy.assertSatisfiedBy(newPassword, 'newPassword');
    const hash = await this.hasher.hash(newPassword);
    const changed = await this.transactions.run(async () => {
      const current = await this.getProfessional(professionalId);
      current.changePasswordHash(hash, this.clock.now());
      await this.professionals.save(current);
      return current;
    });
    return this.subject(changed);
  }

  issueSessionToken({ professional, access }: SessionSubject): Promise<string> {
    return this.tokens.issue({
      professionalId: professional.id,
      accessEndsAt: access.accessEndsAt,
      credentialsVersion: professional.credentialsVersion,
    });
  }

  async assertUnique(email: string, licenseNumber: string, ownerId?: string): Promise<void> {
    const byEmail = await this.professionals.findByEmail(email);
    if (byEmail && byEmail.id !== ownerId) {
      throw new ConflictError('This email is already registered. Log in or use another email.', {
        field: 'email',
      });
    }
    const byLicense = await this.professionals.findByLicenseNumber(licenseNumber);
    if (byLicense && byLicense.id !== ownerId) {
      throw new ConflictError('This license number is already registered.', {
        field: 'licenseNumber',
      });
    }
  }

  static contactOf(professional: Professional): { email: string; name: string } {
    return { email: professional.email, name: professional.fullName };
  }

  private async subject(professional: Professional): Promise<SessionSubject> {
    const access = (await this.access.accessOf(professional.id)) ?? NO_ACCESS;
    return { professional, access };
  }
}
