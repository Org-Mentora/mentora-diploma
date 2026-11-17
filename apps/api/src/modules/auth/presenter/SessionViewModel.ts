import type { ProfessionalDto, SessionDto } from '../contracts/auth.contracts';
import type { SessionSubject } from '../model/AuthService';
import type { Professional } from '../model/Professional';

export interface SessionResult {
  token: string;
  session: SessionDto;
}

export class SessionViewModel {
  static from({ professional, access }: SessionSubject): SessionDto {
    return {
      professional: SessionViewModel.professional(professional),
      subscription: {
        status: access.status,
        hasAccess: access.hasAccess,
        accessEndsAt: access.accessEndsAt.toISOString(),
        daysLeft: access.daysLeft,
      },
    };
  }

  private static professional(professional: Professional): ProfessionalDto {
    return {
      id: professional.id,
      firstName: professional.firstName,
      lastName: professional.lastName,
      fullName: professional.fullName,
      email: professional.email,
      phone: professional.phone,
      specialty: professional.specialty,
      licenseNumber: professional.licenseNumber,
      offices: [...professional.offices],
      hasLogo: professional.hasLogo,
    };
  }
}
