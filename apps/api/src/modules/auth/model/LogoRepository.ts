import type { ProfessionalLogo } from './ProfessionalLogo';

// Repository
export abstract class LogoRepository {
  abstract find(professionalId: string): Promise<ProfessionalLogo | null>;
  abstract save(professionalId: string, logo: ProfessionalLogo, at: Date): Promise<void>;
  abstract delete(professionalId: string): Promise<void>;
}
