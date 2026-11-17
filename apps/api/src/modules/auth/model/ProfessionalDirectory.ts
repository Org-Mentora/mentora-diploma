import type { ProfessionalRepository } from './ProfessionalRepository';

export interface PublicProfessionalProfile {
  fullName: string;
  specialty: string;
  offices: readonly string[];
  email: string;
}

export class ProfessionalDirectory {
  constructor(private readonly professionals: ProfessionalRepository) {}

  async publicProfile(professionalId: string): Promise<PublicProfessionalProfile | null> {
    const professional = await this.professionals.findById(professionalId);
    return professional
      ? {
          fullName: professional.fullName,
          specialty: professional.specialty,
          offices: professional.offices,
          email: professional.email,
        }
      : null;
  }
}
