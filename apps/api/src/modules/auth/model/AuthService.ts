import { ConflictError, UnauthorizedError } from '#core/errors/ApplicationError';
import type { Clock } from '#core/model/Clock';
import type { PasswordHasher } from '#core/security/PasswordHasher';
import type { TokenService } from '#core/security/TokenService';
import { PasswordPolicy } from './PasswordPolicy';
import { Professional } from './Professional';
import type { ProfessionalRepository } from './ProfessionalRepository';

export interface RegisterProfessionalData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialty: string;
  licenseNumber: string;
  password: string;
}

/** Model service for CU-01 (log in) and CU-03 (register professional). */
export class AuthService {
  constructor(
    private readonly professionals: ProfessionalRepository,
    private readonly hasher: PasswordHasher,
    private readonly tokens: TokenService,
    private readonly clock: Clock,
    private readonly trialDays: number,
  ) {}

  get now(): Date {
    return this.clock.now();
  }

  async register(data: RegisterProfessionalData): Promise<Professional> {
    PasswordPolicy.assertSatisfiedBy(data.password);

    if (await this.professionals.findByEmail(Professional.normalizeEmail(data.email))) {
      throw new ConflictError('This email is already registered. Log in or use another email.', {
        field: 'email',
      });
    }
    const license = Professional.normalizeLicense(data.licenseNumber);
    if (await this.professionals.findByLicenseNumber(license)) {
      throw new ConflictError('This license number is already registered.', {
        field: 'licenseNumber',
      });
    }

    const professional = Professional.register(
      { ...data, passwordHash: await this.hasher.hash(data.password) },
      this.clock.now(),
      this.trialDays,
    );
    await this.professionals.save(professional);
    return professional;
  }

  /** Same error for unknown email and wrong password, so accounts cannot be enumerated. */
  async authenticate(email: string, password: string): Promise<Professional> {
    const professional = await this.professionals.findByEmail(Professional.normalizeEmail(email));
    const valid = professional && (await this.hasher.verify(password, professional.passwordHash));
    if (!professional || !valid) {
      throw new UnauthorizedError('Invalid email or password');
    }
    return professional;
  }

  async getProfile(professionalId: string): Promise<Professional> {
    const professional = await this.professionals.findById(professionalId);
    if (!professional) {
      throw new UnauthorizedError('Your account no longer exists');
    }
    return professional;
  }

  issueSessionToken(professional: Professional): Promise<string> {
    return this.tokens.issue({
      professionalId: professional.id,
      accessEndsAt: professional.subscription.accessEndsAt,
    });
  }
}
