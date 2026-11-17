import type { Clock } from '#core/model/Clock';
import type { TransactionManager } from '#core/model/TransactionManager';
import { AuthService, type SessionSubject } from './AuthService';
import type { LogoRepository } from './LogoRepository';
import type { ProfessionalProfile } from './Professional';
import type { ProfessionalAccess } from './ProfessionalAccess';
import { ProfessionalLogo } from './ProfessionalLogo';
import type { ProfessionalRepository } from './ProfessionalRepository';

export class ProfileService {
  constructor(
    private readonly auth: AuthService,
    private readonly professionals: ProfessionalRepository,
    private readonly logos: LogoRepository,
    private readonly access: ProfessionalAccess,
    private readonly transactions: TransactionManager,
    private readonly clock: Clock,
  ) {}

  updateProfile(professionalId: string, profile: ProfessionalProfile): Promise<SessionSubject> {
    return this.transactions.run(async () => {
      const professional = await this.auth.getProfessional(professionalId);
      professional.updateProfile(profile, this.clock.now());
      await this.auth.assertUnique(professional.email, professional.licenseNumber, professional.id);
      await this.professionals.save(professional);
      await this.access.updateContact(professional.id, AuthService.contactOf(professional));
      return this.auth.getSession(professional.id);
    });
  }

  async uploadLogo(professionalId: string, dataUrl: string): Promise<void> {
    const logo = ProfessionalLogo.fromDataUrl(dataUrl);
    await this.transactions.run(async () => {
      const professional = await this.auth.getProfessional(professionalId);
      const now = this.clock.now();
      await this.logos.save(professionalId, logo, now);
      professional.markLogo(now, now);
      await this.professionals.save(professional);
    });
  }

  async removeLogo(professionalId: string): Promise<void> {
    await this.transactions.run(async () => {
      const professional = await this.auth.getProfessional(professionalId);
      await this.logos.delete(professionalId);
      professional.markLogo(null, this.clock.now());
      await this.professionals.save(professional);
    });
  }

  getLogo(professionalId: string): Promise<ProfessionalLogo | null> {
    return this.logos.find(professionalId);
  }
}
